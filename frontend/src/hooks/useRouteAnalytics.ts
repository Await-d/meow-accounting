import { useCallback, useEffect, useState } from 'react';
import { Route } from '@/lib/types';

interface RouteAnalytics {
    path: string;
    accessCount: number;
    averageLoadTime: number;
    lastAccessed: string;
    errorCount: number;
}

interface RouteMetrics {
    startTime: number;
    endTime?: number;
    success: boolean;
    error?: Error;
}

export function useRouteAnalytics() {
    const [analytics, setAnalytics] = useState<Map<string, RouteAnalytics>>(new Map());
    const [currentMetrics, setCurrentMetrics] = useState<RouteMetrics | null>(null);

    // 开始路由加载
    const startRouteLoad = useCallback((path: string) => {
        setCurrentMetrics({
            startTime: performance.now(),
            success: false
        });
    }, []);

    // 结束路由加载
    const endRouteLoad = useCallback((path: string, success: boolean, error?: Error) => {
        if (!currentMetrics) return;

        const endTime = performance.now();
        const loadTime = endTime - currentMetrics.startTime;

        setAnalytics(prev => {
            const routeAnalytics = prev.get(path) || {
                path,
                accessCount: 0,
                averageLoadTime: 0,
                lastAccessed: new Date().toISOString(),
                errorCount: 0
            };

            const newAccessCount = routeAnalytics.accessCount + 1;
            const newAverageLoadTime = (
                (routeAnalytics.averageLoadTime * routeAnalytics.accessCount + loadTime) /
                newAccessCount
            );

            prev.set(path, {
                ...routeAnalytics,
                accessCount: newAccessCount,
                averageLoadTime: newAverageLoadTime,
                lastAccessed: new Date().toISOString(),
                errorCount: success ? routeAnalytics.errorCount : routeAnalytics.errorCount + 1
            });

            return new Map(prev);
        });

        setCurrentMetrics(null);
    }, [currentMetrics]);

    // 获取路由分析数据
    const getRouteAnalytics = useCallback((path: string) => {
        return analytics.get(path);
    }, [analytics]);

    // 获取所有路由分析数据
    const getAllAnalytics = useCallback(() => {
        return Array.from(analytics.values());
    }, [analytics]);

    // 获取性能报告
    const getPerformanceReport = useCallback(() => {
        const allAnalytics = getAllAnalytics();
        return {
            totalRoutes: allAnalytics.length,
            totalAccesses: allAnalytics.reduce((sum, route) => sum + route.accessCount, 0),
            totalErrors: allAnalytics.reduce((sum, route) => sum + route.errorCount, 0),
            averageLoadTime: allAnalytics.reduce((sum, route) => sum + route.averageLoadTime, 0) / allAnalytics.length || 0,
            mostAccessed: allAnalytics.sort((a, b) => b.accessCount - a.accessCount)[0],
            mostErrors: allAnalytics.sort((a, b) => b.errorCount - a.errorCount)[0]
        };
    }, [getAllAnalytics]);

    // 清除分析数据
    const clearAnalytics = useCallback(() => {
        setAnalytics(new Map());
        setCurrentMetrics(null);
    }, []);

    // 导出分析数据
    const exportAnalytics = useCallback(() => {
        return JSON.stringify(Array.from(analytics.entries()), null, 2);
    }, [analytics]);

    return {
        startRouteLoad,
        endRouteLoad,
        getRouteAnalytics,
        getAllAnalytics,
        getPerformanceReport,
        clearAnalytics,
        exportAnalytics
    };
} 