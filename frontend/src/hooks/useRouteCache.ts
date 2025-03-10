import { useState, useCallback, useRef } from 'react';
import { Route } from '@/lib/types';
import { useRouteOptimizer } from './useRouteOptimizer';

interface CachedRoute extends Route {
    lastAccessed: number;
    priority: number;
    size: number;
}

interface CacheConfig {
    maxSize: number;        // 最大缓存大小（字节）
    maxAge: number;         // 最大缓存时间（毫秒）
    minPriority: number;    // 最小优先级阈值
}

const DEFAULT_CONFIG: CacheConfig = {
    maxSize: 5 * 1024 * 1024,  // 5MB
    maxAge: 30 * 60 * 1000,    // 30分钟
    minPriority: 3             // 最小优先级（1-5）
};

export function useRouteCache(config: Partial<CacheConfig> = {}) {
    const { maxSize, maxAge, minPriority } = { ...DEFAULT_CONFIG, ...config };
    const [cache, setCache] = useState<Map<string, CachedRoute>>(new Map());
    const { getRoutePriority } = useRouteOptimizer();
    const totalSizeRef = useRef<number>(0);

    // 估算路由大小
    const estimateRouteSize = useCallback((route: Route) => {
        return JSON.stringify(route).length;
    }, []);

    // 检查缓存项是否过期
    const isExpired = useCallback((cachedRoute: CachedRoute) => {
        const now = Date.now();
        return now - cachedRoute.lastAccessed > maxAge;
    }, [maxAge]);

    // 检查是否应该缓存路由
    const shouldCache = useCallback((route: Route) => {
        const priority = getRoutePriority(route);
        return priority <= minPriority;
    }, [getRoutePriority, minPriority]);

    // 获取缓存的路由
    const getCachedRoute = useCallback((path: string) => {
        const cachedRoute = cache.get(path);
        if (!cachedRoute) return null;

        // 检查是否过期
        if (isExpired(cachedRoute)) {
            cache.delete(path);
            totalSizeRef.current -= cachedRoute.size;
            setCache(new Map(cache));
            return null;
        }

        // 更新访问时间
        cachedRoute.lastAccessed = Date.now();
        setCache(new Map(cache));
        return cachedRoute;
    }, [cache, isExpired]);

    // 清理缓存以腾出空间
    const evictCache = useCallback((requiredSize: number) => {
        const entries = Array.from(cache.entries());

        // 首先删除过期项
        const now = Date.now();
        entries.forEach(([path, route]) => {
            if (isExpired(route)) {
                cache.delete(path);
                totalSizeRef.current -= route.size;
            }
        });

        // 如果仍然需要空间，按 LRU 策略删除
        if (totalSizeRef.current + requiredSize > maxSize) {
            const sortedEntries = entries
                .filter(([_, route]) => !isExpired(route))
                .sort((a, b) => {
                    // 首先按优先级排序，然后按最后访问时间
                    const priorityDiff = b[1].priority - a[1].priority;
                    if (priorityDiff !== 0) return priorityDiff;
                    return a[1].lastAccessed - b[1].lastAccessed;
                });

            for (const [path, route] of sortedEntries) {
                if (totalSizeRef.current + requiredSize <= maxSize) break;
                cache.delete(path);
                totalSizeRef.current -= route.size;
            }
        }

        setCache(new Map(cache));
    }, [cache, isExpired, maxSize]);

    // 缓存路由
    const cacheRoute = useCallback((route: Route) => {
        if (!shouldCache(route)) return;

        const size = estimateRouteSize(route);
        const priority = getRoutePriority(route);

        // 如果需要，清理缓存空间
        if (totalSizeRef.current + size > maxSize) {
            evictCache(size);
        }

        // 添加到缓存
        const cachedRoute: CachedRoute = {
            ...route,
            lastAccessed: Date.now(),
            priority,
            size
        };

        cache.set(route.path, cachedRoute);
        totalSizeRef.current += size;
        setCache(new Map(cache));
    }, [shouldCache, estimateRouteSize, getRoutePriority, maxSize, evictCache, cache]);

    // 清除过期缓存
    const clearExpiredCache = useCallback(() => {
        let hasExpired = false;
        cache.forEach((route, path) => {
            if (isExpired(route)) {
                cache.delete(path);
                totalSizeRef.current -= route.size;
                hasExpired = true;
            }
        });
        if (hasExpired) {
            setCache(new Map(cache));
        }
    }, [cache, isExpired]);

    // 获取缓存统计信息
    const getCacheStats = useCallback(() => {
        return {
            totalSize: totalSizeRef.current,
            itemCount: cache.size,
            maxSize,
            usage: (totalSizeRef.current / maxSize) * 100
        };
    }, [cache, maxSize]);

    return {
        getCachedRoute,
        cacheRoute,
        clearExpiredCache,
        getCacheStats
    };
} 