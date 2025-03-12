import { BaseModel } from './base.model';

interface RouteStats {
    id: number;
    route_id: number;
    access_count: number;
    error_count: number;
    total_load_time: number;
    average_load_time: number;
    last_accessed: string;
    cache_hits: number;
    cache_misses: number;
    created_at: string;
    updated_at: string;
}

interface RecordRouteAccessData {
    route_id: number;
    load_time: number;
    is_error: boolean;
    error_message?: string;
    from_cache: boolean;
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
    routeStats: Record<string, {
        accessCount: number;
        errorCount: number;
        averageLoadTime: number;
        lastAccessed: string;
        cacheHits: number;
        cacheMisses: number;
    }>;
}

export class RouteStatsModel extends BaseModel<RouteStats> {
    constructor() {
        super('route_stats');
    }

    async recordAccess(data: RecordRouteAccessData): Promise<void> {
        const sql = `
            SELECT * FROM route_stats 
            WHERE route_id = ?
        `;
        const existingStats = await this.execute<RouteStats[]>(sql, [data.route_id]);

        if (existingStats && existingStats.length > 0) {
            const stats = existingStats[0];
            const updateSql = `
                UPDATE route_stats 
                SET access_count = access_count + 1,
                    error_count = error_count + ?,
                    total_load_time = total_load_time + ?,
                    average_load_time = (total_load_time + ?) / (access_count + 1),
                    last_accessed = CURRENT_TIMESTAMP,
                    cache_hits = cache_hits + ?,
                    cache_misses = cache_misses + ?
                WHERE route_id = ?
            `;
            await this.execute(updateSql, [
                data.is_error ? 1 : 0,
                data.load_time,
                data.load_time,
                data.from_cache ? 1 : 0,
                data.from_cache ? 0 : 1,
                data.route_id
            ]);
        } else {
            const insertSql = `
                INSERT INTO route_stats (
                    route_id, access_count, error_count, 
                    total_load_time, average_load_time, last_accessed,
                    cache_hits, cache_misses
                ) VALUES (?, 1, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            `;
            await this.execute(insertSql, [
                data.route_id,
                data.is_error ? 1 : 0,
                data.load_time,
                data.load_time,
                data.from_cache ? 1 : 0,
                data.from_cache ? 0 : 1
            ]);
        }

        if (data.is_error && data.error_message) {
            await this.execute(
                `INSERT INTO route_errors (route_id, error_message, created_at)
                 VALUES (?, ?, CURRENT_TIMESTAMP)`,
                [data.route_id, data.error_message]
            );
        }
    }

    async getPerformanceReport(userId: number): Promise<PerformanceReport> {
        const sql = `
            SELECT rs.*, r.path 
            FROM route_stats rs
            JOIN routes r ON rs.route_id = r.id
            WHERE r.user_id = ?
        `;
        const stats = await this.execute<Array<RouteStats & { path: string }>>(sql, [userId]) || [];

        if (stats.length === 0) {
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

        const totalAccesses = stats.reduce((sum, stat) => sum + stat.access_count, 0);
        const totalErrors = stats.reduce((sum, stat) => sum + stat.error_count, 0);
        const totalLoadTime = stats.reduce((sum, stat) => sum + stat.total_load_time, 0);

        const mostAccessed = stats.reduce((max, curr) =>
            !max || curr.access_count > max.access_count ? curr : max, stats[0]
        );

        const mostErrors = stats.reduce((max, curr) =>
            !max || curr.error_count > max.error_count ? curr : max, stats[0]
        );

        const routeStats: Record<string, {
            accessCount: number;
            errorCount: number;
            averageLoadTime: number;
            lastAccessed: string;
            cacheHits: number;
            cacheMisses: number;
        }> = {};

        stats.forEach(s => {
            routeStats[s.path] = {
                accessCount: s.access_count,
                errorCount: s.error_count,
                averageLoadTime: s.average_load_time,
                lastAccessed: s.last_accessed,
                cacheHits: s.cache_hits,
                cacheMisses: s.cache_misses
            };
        });

        return {
            totalRoutes: stats.length,
            totalAccesses,
            totalErrors,
            averageLoadTime: totalAccesses > 0 ? totalLoadTime / totalAccesses : 0,
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

    async clearPerformanceData(userId: number, routeId?: number): Promise<void> {
        let sql = `
            DELETE rs FROM route_stats rs
            JOIN routes r ON rs.route_id = r.id
            WHERE r.user_id = ?
        `;
        const params = [userId];

        if (routeId) {
            sql += ' AND rs.route_id = ?';
            params.push(routeId);
        }

        await this.execute(sql, params);
    }

    async getCacheStats(userId: number): Promise<{ hits: number; misses: number }> {
        const sql = `
            SELECT 
                SUM(rs.cache_hits) as hits,
                SUM(rs.cache_misses) as misses
            FROM route_stats rs
            JOIN routes r ON rs.route_id = r.id
            WHERE r.user_id = ?
        `;
        const result = await this.execute<[{ hits: number; misses: number }]>(sql, [userId]);
        return result[0] || { hits: 0, misses: 0 };
    }

    async getPreheatStatus(userId: number): Promise<Record<string, boolean>> {
        const sql = `
            SELECT r.path, rs.cache_hits > 0 as is_preheated
            FROM routes r
            LEFT JOIN route_stats rs ON r.id = rs.route_id
            WHERE r.user_id = ?
        `;
        const results = await this.execute<{ path: string; is_preheated: number }[]>(sql, [userId]);
        return results.reduce((acc, curr) => ({
            ...acc,
            [curr.path]: Boolean(curr.is_preheated)
        }), {} as Record<string, boolean>);
    }
}

export const routeStatsModel = new RouteStatsModel();
