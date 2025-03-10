import { db } from '../config/database';
import { RouteStats, RecordRouteAccessData, PerformanceReport } from '../types';

// 记录路由访问
export async function recordAccess(data: RecordRouteAccessData): Promise<void> {
    const { route_id, load_time, is_error, error_message, from_cache } = data;

    // 获取现有统计数据
    const stats = await db.get<RouteStats>(
        'SELECT * FROM route_stats WHERE route_id = ?',
        [route_id]
    );

    if (stats) {
        // 更新现有统计
        await db.run(
            `UPDATE route_stats SET 
            access_count = access_count + 1,
            error_count = error_count + ?,
            total_load_time = total_load_time + ?,
            average_load_time = (total_load_time + ?) / (access_count + 1),
            last_accessed = CURRENT_TIMESTAMP,
            cache_hits = cache_hits + ?,
            cache_misses = cache_misses + ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE route_id = ?`,
            [
                is_error ? 1 : 0,
                load_time,
                load_time,
                from_cache ? 1 : 0,
                from_cache ? 0 : 1,
                route_id
            ]
        );
    } else {
        // 创建新统计
        await db.run(
            `INSERT INTO route_stats (
                route_id, access_count, error_count, 
                total_load_time, average_load_time, last_accessed,
                cache_hits, cache_misses
            ) VALUES (?, 1, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
            [
                route_id,
                is_error ? 1 : 0,
                load_time,
                load_time,
                from_cache ? 1 : 0,
                from_cache ? 0 : 1
            ]
        );
    }

    // 如果有错误，记录错误信息
    if (is_error && error_message) {
        await db.run(
            `INSERT INTO route_errors (
                route_id, error_message, created_at
            ) VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [route_id, error_message]
        );
    }
}

// 获取性能报告
export async function getPerformanceReport(
    userId: number,
    startDate?: string,
    endDate?: string
): Promise<PerformanceReport> {
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
        dateFilter = 'AND rs.created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }

    // 获取基础统计数据
    const stats = await db.all<RouteStats[]>(
        `SELECT rs.*, r.path
        FROM route_stats rs
        JOIN routes r ON rs.route_id = r.id
        WHERE r.user_id = ? ${dateFilter}`,
        [userId, ...params]
    );

    if (!stats.length) {
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

    // 计算总体统计
    const totalAccesses = stats.reduce((sum, s) => sum + s.access_count, 0);
    const totalErrors = stats.reduce((sum, s) => sum + s.error_count, 0);
    const totalLoadTime = stats.reduce((sum, s) => sum + s.total_load_time, 0);

    // 找出访问最多和错误最多的路由
    const mostAccessed = stats.reduce((max, curr) =>
        curr.access_count > (max?.access_count || 0) ? curr : max
    );

    const mostErrors = stats.reduce((max, curr) =>
        curr.error_count > (max?.error_count || 0) ? curr : max
    );

    // 构建路由统计映射
    const routeStats = stats.reduce((map, stat) => ({
        ...map,
        [stat.path]: {
            accessCount: stat.access_count,
            errorCount: stat.error_count,
            averageLoadTime: stat.average_load_time,
            lastAccessed: stat.last_accessed,
            cacheHits: stat.cache_hits,
            cacheMisses: stat.cache_misses
        }
    }), {});

    return {
        totalRoutes: stats.length,
        totalAccesses,
        totalErrors,
        averageLoadTime: totalLoadTime / totalAccesses,
        mostAccessed: mostAccessed ? {
            path: mostAccessed.path,
            accessCount: mostAccessed.access_count,
            averageLoadTime: mostAccessed.average_load_time,
            lastAccessed: mostAccessed.last_accessed,
            errorCount: mostAccessed.error_count
        } : null,
        mostErrors: mostErrors ? {
            path: mostErrors.path,
            accessCount: mostErrors.access_count,
            averageLoadTime: mostErrors.average_load_time,
            lastAccessed: mostErrors.last_accessed,
            errorCount: mostErrors.error_count
        } : null,
        routeStats
    };
}

// 清除性能数据
export async function clearPerformanceData(routeId: number, userId: number): Promise<void> {
    await db.run(
        `DELETE FROM route_stats 
        WHERE route_id = ? 
        AND route_id IN (SELECT id FROM routes WHERE user_id = ?)`,
        [routeId, userId]
    );

    await db.run(
        `DELETE FROM route_errors 
        WHERE route_id = ? 
        AND route_id IN (SELECT id FROM routes WHERE user_id = ?)`,
        [routeId, userId]
    );
}

// 获取缓存统计
export async function getCacheStats(routeId: number): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
}> {
    const stats = await db.get<RouteStats>(
        'SELECT cache_hits, cache_misses FROM route_stats WHERE route_id = ?',
        [routeId]
    );

    if (!stats) {
        return {
            hits: 0,
            misses: 0,
            hitRate: 0
        };
    }

    const total = stats.cache_hits + stats.cache_misses;
    return {
        hits: stats.cache_hits,
        misses: stats.cache_misses,
        hitRate: total > 0 ? stats.cache_hits / total : 0
    };
}

// 获取预热状态
export async function getPreheatStatus(userId: number): Promise<{
    preheating: string[];
    preheated: string[];
}> {
    const routes = await db.all<{ path: string; is_preheated: boolean }[]>(
        `SELECT r.path, 
        CASE WHEN rs.last_accessed IS NOT NULL THEN 1 ELSE 0 END as is_preheated
        FROM routes r
        LEFT JOIN route_stats rs ON r.id = rs.route_id
        WHERE r.user_id = ?`,
        [userId]
    );

    return {
        preheating: routes.filter(r => !r.is_preheated).map(r => r.path),
        preheated: routes.filter(r => r.is_preheated).map(r => r.path)
    };
} 