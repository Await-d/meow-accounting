import { useCallback, useEffect, useRef } from 'react';
import { Route, RouteType } from '@/lib/types';
import { routeComponents } from '@/config/routes';

// 路由优先级配置
const ROUTE_PRIORITIES = {
    [RouteType.DASHBOARD]: 1,    // 最高优先级
    [RouteType.TRANSACTIONS]: 2,
    [RouteType.STATISTICS]: 3,
    [RouteType.SETTINGS]: 4,
    [RouteType.CUSTOM]: 5
};

// 预热配置
const PREHEAT_CONFIG = {
    maxConcurrent: 2,           // 最大并发预热数
    interval: 5000,             // 预热间隔（毫秒）
    timeout: 10000             // 预热超时时间（毫秒）
};

export function useRouteOptimizer() {
    const preheatingRef = useRef<Set<string>>(new Set());
    const preheatedRef = useRef<Set<string>>(new Set());

    // 获取路由优先级
    const getRoutePriority = useCallback((route: Route) => {
        return ROUTE_PRIORITIES[route.type] || Infinity;
    }, []);

    // 按优先级排序路由
    const sortRoutesByPriority = useCallback((routes: Route[]) => {
        return [...routes].sort((a, b) => getRoutePriority(a) - getRoutePriority(b));
    }, [getRoutePriority]);

    // 预热单个路由
    const preheatRoute = useCallback(async (route: Route) => {
        if (preheatingRef.current.has(route.path) || preheatedRef.current.has(route.path)) {
            return;
        }

        preheatingRef.current.add(route.path);

        try {
            const routeConfig = routeComponents[route.type];
            if (!routeConfig) return;

            // 使用 Promise.race 添加超时控制
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('预热超时')), PREHEAT_CONFIG.timeout);
            });

            const preheatPromise = Promise.all([
                routeConfig.component(),
                routeConfig.layout ? routeConfig.layout() : Promise.resolve(null)
            ]);

            await Promise.race([preheatPromise, timeoutPromise]);
            preheatedRef.current.add(route.path);
        } catch (error) {
            console.warn(`路由预热失败: ${route.path}`, error);
        } finally {
            preheatingRef.current.delete(route.path);
        }
    }, []);

    // 批量预热路由
    const preheatRoutes = useCallback(async (routes: Route[]) => {
        const prioritizedRoutes = sortRoutesByPriority(routes);
        const chunks = [];

        // 将路由分成大小为 maxConcurrent 的块
        for (let i = 0; i < prioritizedRoutes.length; i += PREHEAT_CONFIG.maxConcurrent) {
            chunks.push(prioritizedRoutes.slice(i, i + PREHEAT_CONFIG.maxConcurrent));
        }

        // 按块顺序预热路由
        for (const chunk of chunks) {
            await Promise.all(chunk.map(route => preheatRoute(route)));
            if (chunks.indexOf(chunk) < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, PREHEAT_CONFIG.interval));
            }
        }
    }, [preheatRoute, sortRoutesByPriority]);

    // 检查路由是否已预热
    const isRoutePreheated = useCallback((path: string) => {
        return preheatedRef.current.has(path);
    }, []);

    // 获取预热状态
    const getPreheatStatus = useCallback(() => {
        return {
            preheating: Array.from(preheatingRef.current),
            preheated: Array.from(preheatedRef.current)
        };
    }, []);

    // 清除预热缓存
    const clearPreheatCache = useCallback(() => {
        preheatingRef.current.clear();
        preheatedRef.current.clear();
    }, []);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            clearPreheatCache();
        };
    }, [clearPreheatCache]);

    return {
        preheatRoute,
        preheatRoutes,
        isRoutePreheated,
        getPreheatStatus,
        clearPreheatCache,
        getRoutePriority,
        sortRoutesByPriority
    };
} 