'use client';

import { useState, useCallback } from 'react';

interface RouteStats {
    accessCount: number;
    errorCount: number;
    totalLoadTime: number;
    averageLoadTime: number;
    lastAccessed: string;
}

interface PerformanceReport {
    totalRoutes: number;
    totalAccesses: number;
    totalErrors: number;
    averageLoadTime: number;
    mostAccessed: {
        path: string;
        accessCount: number;
        averageLoadTime: number;
        lastAccessed: string;
        errorCount: number;
    } | null;
    mostErrors: {
        path: string;
        accessCount: number;
        averageLoadTime: number;
        lastAccessed: string;
        errorCount: number;
    } | null;
    routeStats: Record<string, RouteStats>;
}

export function useRouteMonitor() {
    const [stats, setStats] = useState<Record<string, RouteStats>>({});

    const startRouteLoad = useCallback((path: string): number => {
        return performance.now();
    }, []);

    const endRouteLoad = useCallback((
        path: string,
        success: boolean,
        error?: Error,
        startTime?: number,
        fromCache: boolean = false
    ) => {
        const loadTime = startTime ? performance.now() - startTime : 0;

        setStats(prev => {
            const routeStats = prev[path] || {
                accessCount: 0,
                errorCount: 0,
                totalLoadTime: 0,
                averageLoadTime: 0,
                lastAccessed: new Date().toISOString()
            };

            const newStats = {
                ...routeStats,
                accessCount: routeStats.accessCount + 1,
                errorCount: success ? routeStats.errorCount : routeStats.errorCount + 1,
                totalLoadTime: routeStats.totalLoadTime + (fromCache ? 0 : loadTime),
                averageLoadTime: fromCache ?
                    routeStats.averageLoadTime :
                    (routeStats.totalLoadTime + loadTime) / (routeStats.accessCount + 1),
                lastAccessed: new Date().toISOString()
            };

            return {
                ...prev,
                [path]: newStats
            };
        });
    }, []);

    const getPerformanceReport = useCallback((): PerformanceReport => {
        const paths = Object.keys(stats);
        if (paths.length === 0) {
            return {
                totalRoutes: 0,
                totalAccesses: 0,
                totalErrors: 0,
                averageLoadTime: 0,
                mostAccessed: null,
                mostErrors: null,
                routeStats: {}
            };
        }

        let totalAccesses = 0;
        let totalErrors = 0;
        let totalLoadTime = 0;
        let mostAccessedPath = paths[0];
        let mostErrorsPath = paths[0];

        paths.forEach(path => {
            const routeStats = stats[path];
            totalAccesses += routeStats.accessCount;
            totalErrors += routeStats.errorCount;
            totalLoadTime += routeStats.totalLoadTime;

            if (routeStats.accessCount > stats[mostAccessedPath].accessCount) {
                mostAccessedPath = path;
            }
            if (routeStats.errorCount > stats[mostErrorsPath].errorCount) {
                mostErrorsPath = path;
            }
        });

        return {
            totalRoutes: paths.length,
            totalAccesses,
            totalErrors,
            averageLoadTime: totalLoadTime / totalAccesses,
            mostAccessed: {
                path: mostAccessedPath,
                ...stats[mostAccessedPath]
            },
            mostErrors: {
                path: mostErrorsPath,
                ...stats[mostErrorsPath]
            },
            routeStats: stats
        };
    }, [stats]);

    const clearPerformanceData = useCallback(() => {
        setStats({});
    }, []);

    return {
        startRouteLoad,
        endRouteLoad,
        getPerformanceReport,
        clearPerformanceData
    };
} 