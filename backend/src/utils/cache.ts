import Redis from 'ioredis';
import { logError } from './logger';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

interface PoolOptions {
    min: number;
    max: number;
    acquireTimeout: number;
}

class ConnectionPool {
    private pool: Redis[] = [];
    private inUse: Set<Redis> = new Set();
    private options: PoolOptions;

    constructor(options: PoolOptions) {
        this.options = options;
        this.initialize();
    }

    private async initialize() {
        for (let i = 0; i < this.options.min; i++) {
            this.pool.push(this.createConnection());
        }
    }

    private createConnection(): Redis {
        return new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
    }

    public async acquire(): Promise<Redis> {
        // 尝试获取空闲连接
        const connection = this.pool.find(conn => !this.inUse.has(conn));
        if (connection) {
            this.inUse.add(connection);
            return connection;
        }

        // 如果没有空闲连接且未达到最大值，创建新连接
        if (this.pool.length < this.options.max) {
            const newConnection = this.createConnection();
            this.pool.push(newConnection);
            this.inUse.add(newConnection);
            return newConnection;
        }

        // 等待连接释放
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('获取连接超时'));
            }, this.options.acquireTimeout);

            const checkConnection = setInterval(() => {
                const conn = this.pool.find(c => !this.inUse.has(c));
                if (conn) {
                    clearTimeout(timeout);
                    clearInterval(checkConnection);
                    this.inUse.add(conn);
                    resolve(conn);
                }
            }, 100);
        });
    }

    public release(connection: Redis): void {
        this.inUse.delete(connection);
    }

    public async closeAll(): Promise<void> {
        await Promise.all(this.pool.map(conn => conn.quit()));
        this.pool = [];
        this.inUse.clear();
    }
}

class LRUCache<T> {
    private capacity: number;
    private cache: Map<string, T>;
    private keyList: string[];

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map();
        this.keyList = [];
    }

    get(key: string): T | null {
        if (!this.cache.has(key)) {
            return null;
        }

        // 更新访问顺序
        this.keyList = this.keyList.filter(k => k !== key);
        this.keyList.push(key);

        return this.cache.get(key) || null;
    }

    set(key: string, value: T): void {
        if (this.cache.has(key)) {
            // 更新现有键
            this.cache.set(key, value);
            this.keyList = this.keyList.filter(k => k !== key);
            this.keyList.push(key);
        } else {
            // 添加新键
            if (this.keyList.length >= this.capacity) {
                // 删除最久未使用的键
                const oldestKey = this.keyList.shift();
                if (oldestKey) {
                    this.cache.delete(oldestKey);
                }
            }
            this.cache.set(key, value);
            this.keyList.push(key);
        }
    }

    delete(key: string): void {
        this.cache.delete(key);
        this.keyList = this.keyList.filter(k => k !== key);
    }

    clear(): void {
        this.cache.clear();
        this.keyList = [];
    }

    size(): number {
        return this.cache.size;
    }
}

class Cache {
    private static instance: Cache;
    private pool: ConnectionPool;
    private compressionThreshold = 1024; // 1KB以上的数据进行压缩
    private localCache: LRUCache<{
        value: any;
        expireAt?: number;
    }>;

    private constructor() {
        this.pool = new ConnectionPool({
            min: 2,
            max: 10,
            acquireTimeout: 5000
        });

        // 初始化本地LRU缓存，默认容量1000
        this.localCache = new LRUCache(1000);
    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    private async compress(data: string): Promise<Buffer> {
        return await gzip(Buffer.from(data));
    }

    private async decompress(data: Buffer): Promise<string> {
        const decompressed = await gunzip(data);
        return decompressed.toString();
    }

    // 设置缓存
    public async set(
        key: string,
        value: any,
        expireSeconds?: number
    ): Promise<void> {
        const client = await this.pool.acquire();
        try {
            const stringValue = JSON.stringify(value);
            let finalValue = stringValue;
            let finalKey = key;

            // 如果数据大小超过阈值，进行压缩
            if (stringValue.length > this.compressionThreshold) {
                const compressed = await this.compress(stringValue);
                finalValue = compressed.toString('base64');
                finalKey = `compressed:${key}`;
            }

            if (expireSeconds) {
                await client.setex(finalKey, expireSeconds, finalValue);
                // 存入本地缓存
                this.localCache.set(key, {
                    value,
                    expireAt: Date.now() + expireSeconds * 1000
                });
            } else {
                await client.set(finalKey, finalValue);
                // 存入本地缓存
                this.localCache.set(key, { value });
            }
        } catch (error) {
            logError(error as Error, { context: '设置缓存失败', key });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 获取缓存
    public async get<T>(key: string): Promise<T | null> {
        // 先检查本地缓存
        const localValue = this.localCache.get(key);
        if (localValue) {
            if (!localValue.expireAt || localValue.expireAt > Date.now()) {
                return localValue.value as T;
            }
            // 如果已过期，从本地缓存中删除
            this.localCache.delete(key);
        }

        const client = await this.pool.acquire();
        try {
            const value = await client.get(key);
            if (!value) {
                // 尝试获取压缩的数据
                const compressedValue = await client.get(`compressed:${key}`);
                if (!compressedValue) return null;

                const decompressed = await this.decompress(
                    Buffer.from(compressedValue, 'base64')
                );
                const parsed = JSON.parse(decompressed) as T;

                // 存入本地缓存
                this.localCache.set(key, {
                    value: parsed
                });

                return parsed;
            }

            const parsed = JSON.parse(value) as T;
            // 存入本地缓存
            this.localCache.set(key, {
                value: parsed
            });

            return parsed;
        } catch (error) {
            logError(error as Error, { context: '获取缓存失败', key });
            return null;
        } finally {
            this.pool.release(client);
        }
    }

    // 删除缓存
    public async del(key: string): Promise<void> {
        const client = await this.pool.acquire();
        try {
            await client.del(key);
            await client.del(`compressed:${key}`);
            // 从本地缓存中删除
            this.localCache.delete(key);
        } catch (error) {
            logError(error as Error, { context: '删除缓存失败', key });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 设置哈希表字段
    public async hset(
        key: string,
        field: string,
        value: any
    ): Promise<void> {
        const client = await this.pool.acquire();
        try {
            const stringValue = JSON.stringify(value);
            await client.hset(key, field, stringValue);
        } catch (error) {
            logError(error as Error, {
                context: '设置哈希表字段失败',
                key,
                field
            });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 获取哈希表字段
    public async hget<T>(key: string, field: string): Promise<T | null> {
        const client = await this.pool.acquire();
        try {
            const value = await client.hget(key, field);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logError(error as Error, {
                context: '获取哈希表字段失败',
                key,
                field
            });
            return null;
        } finally {
            this.pool.release(client);
        }
    }

    // 删除哈希表字段
    public async hdel(key: string, field: string): Promise<void> {
        const client = await this.pool.acquire();
        try {
            await client.hdel(key, field);
        } catch (error) {
            logError(error as Error, {
                context: '删除哈希表字段失败',
                key,
                field
            });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 设置带有过期时间的哈希表字段
    public async hsetex(
        key: string,
        field: string,
        value: any,
        expireSeconds: number
    ): Promise<void> {
        const client = await this.pool.acquire();
        try {
            const stringValue = JSON.stringify(value);
            const pipeline = client.pipeline();
            pipeline.hset(key, field, stringValue);
            pipeline.expire(key, expireSeconds);
            await pipeline.exec();
        } catch (error) {
            logError(error as Error, {
                context: '设置带过期时间的哈希表字段失败',
                key,
                field
            });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 获取所有哈希表字段
    public async hgetall<T>(key: string): Promise<Record<string, T> | null> {
        const client = await this.pool.acquire();
        try {
            const values = await client.hgetall(key);
            if (!values || Object.keys(values).length === 0) return null;

            return Object.entries(values).reduce((acc, [field, value]) => ({
                ...acc,
                [field]: JSON.parse(value)
            }), {});
        } catch (error) {
            logError(error as Error, {
                context: '获取所有哈希表字段失败',
                key
            });
            return null;
        } finally {
            this.pool.release(client);
        }
    }

    // 清除所有缓存
    public async clear(): Promise<void> {
        const client = await this.pool.acquire();
        try {
            await client.flushdb();
        } catch (error) {
            logError(error as Error, { context: '清除所有缓存失败' });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 关闭连接池
    public async close(): Promise<void> {
        await this.pool.closeAll();
    }

    // 缓存预热
    public async warmup(keys: string[]): Promise<void> {
        const client = await this.pool.acquire();
        try {
            const pipeline = client.pipeline();
            for (const key of keys) {
                pipeline.get(key);
            }
            await pipeline.exec();
        } catch (error) {
            logError(error as Error, { context: '缓存预热失败' });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 获取缓存统计
    public async getStats(): Promise<{
        keys: number;
        memory: number;
        hits: number;
        misses: number;
    }> {
        const client = await this.pool.acquire();
        try {
            const info = await client.info();
            const stats = {
                keys: 0,
                memory: 0,
                hits: 0,
                misses: 0
            };

            // 解析Redis INFO命令的输出
            const lines = info.split('\n');
            for (const line of lines) {
                if (line.includes('used_memory:')) {
                    stats.memory = parseInt(line.split(':')[1]);
                } else if (line.includes('keyspace_hits:')) {
                    stats.hits = parseInt(line.split(':')[1]);
                } else if (line.includes('keyspace_misses:')) {
                    stats.misses = parseInt(line.split(':')[1]);
                }
            }

            // 获取键数量
            stats.keys = parseInt(await client.dbsize() as any);

            return stats;
        } catch (error) {
            logError(error as Error, { context: '获取缓存统计失败' });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 按模式删除缓存
    public async delByPattern(pattern: string): Promise<number> {
        const client = await this.pool.acquire();
        try {
            const stream = client.scanStream({
                match: pattern,
                count: 100
            });

            let deletedCount = 0;
            for await (const keys of stream) {
                if (keys.length) {
                    await client.del(...keys);
                    deletedCount += keys.length;
                }
            }

            return deletedCount;
        } catch (error) {
            logError(error as Error, {
                context: '按模式删除缓存失败',
                pattern
            });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 监控内存使用
    public async monitorMemory(threshold = 0.8): Promise<void> {
        const client = await this.pool.acquire();
        try {
            const info = await client.info('memory');
            const maxMemory = parseInt(info.split('\n')
                .find(line => line.startsWith('maxmemory:'))
                ?.split(':')[1] || '0');
            const usedMemory = parseInt(info.split('\n')
                .find(line => line.startsWith('used_memory:'))
                ?.split(':')[1] || '0');

            if (maxMemory > 0 && usedMemory / maxMemory > threshold) {
                logError(new Error('Redis内存使用超过阈值'), {
                    context: '内存监控',
                    usedMemory,
                    maxMemory,
                    threshold
                });
            }
        } catch (error) {
            logError(error as Error, { context: '监控内存使用失败' });
            throw error;
        } finally {
            this.pool.release(client);
        }
    }

    // 获取本地缓存统计
    public getLocalCacheStats(): {
        size: number;
        capacity: number;
    } {
        return {
            size: this.localCache.size(),
            capacity: 1000
        };
    }
}

export const cache = Cache.getInstance(); 