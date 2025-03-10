import axios from 'axios';

export interface CacheStats {
    redis: {
        keys: number;
        memory: number;
        hits: number;
        misses: number;
    };
    local: {
        size: number;
        capacity: number;
    };
    total: {
        keys: number;
        memory: number;
        hits: number;
        misses: number;
        hitRate: number;
    };
}

// 获取缓存统计信息
export const getCacheStats = async (): Promise<CacheStats> => {
    const response = await axios.get('/api/cache/stats');
    return response.data;
};

// 清除指定模式的缓存
export const clearCachePattern = async (pattern: string): Promise<number> => {
    const response = await axios.delete(`/api/cache/pattern/${pattern}`);
    return response.data.deletedCount;
};

// 清除所有缓存
export const clearAllCache = async (): Promise<void> => {
    await axios.delete('/api/cache/all');
};

// 预热指定的缓存键
export const warmupCache = async (keys: string[]): Promise<void> => {
    await axios.post('/api/cache/warmup', { keys });
};

// 监控内存使用
export const monitorMemory = async (threshold?: number): Promise<void> => {
    await axios.get('/api/cache/memory', {
        params: { threshold }
    });
}; 