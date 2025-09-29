import { Request, Response, NextFunction } from 'express';
import { cache } from '../utils/cache';
import { logPerformance } from '../utils/logger';

// 缓存键生成器
const generateCacheKey = (req: Request): string => {
    const { baseUrl, path, query, user } = req;
    return `route:${baseUrl}${path}:${JSON.stringify(query)}:${user?.id || 'guest'}`;
};

// 缓存中间件选项接口
interface CacheOptions {
    expire?: number;        // 过期时间（秒）
    condition?: (req: Request) => boolean;  // 缓存条件
    key?: (req: Request) => string;        // 自定义缓存键生成器
    preload?: boolean;      // 是否预加载
    monitor?: boolean;      // 是否监控内存
}

// 缓存中间件
export const cacheRoute = (options: CacheOptions = {}) => {
    const {
        expire = 300,  // 默认5分钟
        condition = () => true,
        key = generateCacheKey,
        preload = false,
        monitor = false
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        // 只缓存GET请求
        if (req.method !== 'GET' || !condition(req)) {
            return next();
        }

        const cacheKey = key(req);
        const start = Date.now();

        try {
            // 监控内存使用
            if (monitor) {
                await cache.monitorMemory();
            }

            // 尝试从缓存获取
            const cachedData = await cache.get(cacheKey);

            if (cachedData) {
                // 记录性能数据
                const loadTime = Date.now() - start;
                logPerformance(
                    req.route?.path ? 1 : 0,
                    loadTime,
                    false,
                    true
                );

                // 返回缓存数据
                return res.json(cachedData);
            }

            // 重写res.json方法以捕获响应数据
            const originalJson = res.json;
            res.json = function (data) {
                const loadTime = Date.now() - start;

                // 记录性能数据
                logPerformance(
                    req.route?.path ? 1 : 0,
                    loadTime,
                    false,
                    false
                );

                // 存储到缓存
                cache.set(cacheKey, data, expire).catch(err => {
                    console.error('缓存存储失败:', err);
                });

                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('缓存中间件错误:', error);
            next();
        }
    };
};

// 清除缓存中间件
export const clearCache = (pattern: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const deletedCount = await cache.delByPattern(pattern);
            console.log(`已清除 ${deletedCount} 个缓存项`);
            next();
        } catch (error) {
            console.error('清除缓存失败:', error);
            next();
        }
    };
};

// 缓存统计中间件
export const cacheStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const stats = await cache.getStats();
        res.locals.cacheStats = stats;
        next();
    } catch (error) {
        console.error('获取缓存统计失败:', error);
        next();
    }
};

// 缓存预热中间件
export const warmupCache = (keys: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cache.warmup(keys);
            next();
        } catch (error) {
            console.error('缓存预热失败:', error);
            next();
        }
    };
}; 