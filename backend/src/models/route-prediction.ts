/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 路由预测模型 - 基于统计学习的路由访问预测
 */
import { BaseModel } from './base.model';

interface RouteAccessHistory {
    id: number;
    route_id: number;
    user_id: number;
    accessed_at: string;
    previous_route_id: number | null;
    session_id: string;
    load_time: number;
}

interface RoutePrediction {
    routeId: number;
    path: string;
    name: string;
    confidence: number; // 0-100
    lastAccess: string;
    accessCount: number;
    averageLoadTime: number;
}

interface RouteTransitionPattern {
    from_route_id: number;
    to_route_id: number;
    transition_count: number;
    probability: number;
}

export class RoutePredictionModel extends BaseModel<RouteAccessHistory> {
    constructor() {
        super('route_access_history');
    }

    /**
     * 记录路由访问历史
     */
    async recordAccess(
        routeId: number,
        userId: number,
        sessionId: string,
        previousRouteId: number | null,
        loadTime: number
    ): Promise<void> {
        const sql = `
            INSERT INTO route_access_history (
                route_id, user_id, accessed_at, previous_route_id,
                session_id, load_time
            ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
        `;
        await this.execute(sql, [routeId, userId, previousRouteId, sessionId, loadTime]);
    }

    /**
     * 基于马尔可夫链预测下一个可能访问的路由
     */
    async predictNextRoutes(userId: number, currentRouteId: number, limit: number = 5): Promise<RoutePrediction[]> {
        // 1. 获取从当前路由转移到其他路由的历史模式
        const transitionSql = `
            SELECT
                h2.route_id as to_route_id,
                COUNT(*) as transition_count
            FROM route_access_history h1
            JOIN route_access_history h2 ON h1.session_id = h2.session_id
                AND h2.accessed_at > h1.accessed_at
                AND datetime(h2.accessed_at) <= datetime(h1.accessed_at, '+5 minutes')
            WHERE h1.user_id = ? AND h1.route_id = ?
            GROUP BY h2.route_id
            ORDER BY transition_count DESC
            LIMIT ?
        `;

        const transitions = await this.execute<Array<{ to_route_id: number; transition_count: number }>>(
            transitionSql,
            [userId, currentRouteId, limit * 2]
        );

        if (!transitions || transitions.length === 0) {
            // 如果没有转移模式，返回用户最常访问的路由
            return this.getMostFrequentRoutes(userId, limit);
        }

        // 2. 计算转移概率
        const totalTransitions = transitions.reduce((sum, t) => sum + t.transition_count, 0);

        // 3. 获取每个路由的详细信息和统计数据
        const predictions: RoutePrediction[] = [];

        for (const transition of transitions.slice(0, limit)) {
            const routeInfoSql = `
                SELECT
                    r.id, r.path, r.name,
                    COUNT(h.id) as access_count,
                    AVG(h.load_time) as average_load_time,
                    MAX(h.accessed_at) as last_access
                FROM routes r
                LEFT JOIN route_access_history h ON r.id = h.route_id AND h.user_id = ?
                WHERE r.id = ?
                GROUP BY r.id
            `;

            const routeInfo = await this.execute<Array<{
                id: number;
                path: string;
                name: string;
                access_count: number;
                average_load_time: number;
                last_access: string;
            }>>(routeInfoSql, [userId, transition.to_route_id]);

            if (routeInfo && routeInfo.length > 0) {
                const info = routeInfo[0];
                const baseProbability = transition.transition_count / totalTransitions;

                // 结合访问频率调整置信度
                const frequencyBoost = Math.min(info.access_count / 100, 0.2); // 最多加20%
                const confidence = Math.min((baseProbability + frequencyBoost) * 100, 99);

                predictions.push({
                    routeId: info.id,
                    path: info.path,
                    name: info.name,
                    confidence: Math.round(confidence),
                    lastAccess: info.last_access,
                    accessCount: info.access_count,
                    averageLoadTime: info.average_load_time || 0
                });
            }
        }

        return predictions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * 获取用户最常访问的路由（备用预测方法）
     */
    public async getMostFrequentRoutes(userId: number, limit: number): Promise<RoutePrediction[]> {
        const sql = `
            SELECT
                r.id, r.path, r.name,
                COUNT(h.id) as access_count,
                AVG(h.load_time) as average_load_time,
                MAX(h.accessed_at) as last_access
            FROM routes r
            JOIN route_access_history h ON r.id = h.route_id
            WHERE h.user_id = ?
            GROUP BY r.id
            ORDER BY access_count DESC, last_access DESC
            LIMIT ?
        `;

        const routes = await this.execute<Array<{
            id: number;
            path: string;
            name: string;
            access_count: number;
            average_load_time: number;
            last_access: string;
        }>>(sql, [userId, limit]);

        if (!routes || routes.length === 0) {
            return [];
        }

        // 基于访问频率计算置信度
        const maxCount = routes[0].access_count;

        return routes.map(route => ({
            routeId: route.id,
            path: route.path,
            name: route.name,
            confidence: Math.round((route.access_count / maxCount) * 70), // 最高70%置信度
            lastAccess: route.last_access,
            accessCount: route.access_count,
            averageLoadTime: route.average_load_time || 0
        }));
    }

    /**
     * 获取路由转移模式统计
     */
    async getTransitionPatterns(userId: number): Promise<RouteTransitionPattern[]> {
        const sql = `
            SELECT
                h1.route_id as from_route_id,
                h2.route_id as to_route_id,
                COUNT(*) as transition_count
            FROM route_access_history h1
            JOIN route_access_history h2 ON h1.session_id = h2.session_id
                AND h2.accessed_at > h1.accessed_at
                AND datetime(h2.accessed_at) <= datetime(h1.accessed_at, '+5 minutes')
            WHERE h1.user_id = ?
            GROUP BY h1.route_id, h2.route_id
            HAVING transition_count >= 2
            ORDER BY transition_count DESC
        `;

        const patterns = await this.execute<Array<{
            from_route_id: number;
            to_route_id: number;
            transition_count: number;
        }>>(sql, [userId]);

        // 计算每个起始路由的总转移次数
        const fromRouteCounts: Record<number, number> = {};
        patterns.forEach(p => {
            fromRouteCounts[p.from_route_id] = (fromRouteCounts[p.from_route_id] || 0) + p.transition_count;
        });

        // 计算转移概率
        return patterns.map(p => ({
            from_route_id: p.from_route_id,
            to_route_id: p.to_route_id,
            transition_count: p.transition_count,
            probability: p.transition_count / (fromRouteCounts[p.from_route_id] || 1)
        }));
    }

    /**
     * 基于时间模式预测用户可能访问的路由
     */
    async predictByTimePattern(userId: number, limit: number = 5): Promise<RoutePrediction[]> {
        // 获取当前时间段（小时）
        const currentHour = new Date().getHours();

        const sql = `
            SELECT
                r.id, r.path, r.name,
                COUNT(h.id) as access_count,
                AVG(h.load_time) as average_load_time,
                MAX(h.accessed_at) as last_access
            FROM routes r
            JOIN route_access_history h ON r.id = h.route_id
            WHERE h.user_id = ?
            AND CAST(strftime('%H', h.accessed_at) AS INTEGER)
                BETWEEN ? AND ?
            GROUP BY r.id
            ORDER BY access_count DESC
            LIMIT ?
        `;

        // 查找前后1小时范围内的访问模式
        const routes = await this.execute<Array<{
            id: number;
            path: string;
            name: string;
            access_count: number;
            average_load_time: number;
            last_access: string;
        }>>(sql, [userId, currentHour - 1, currentHour + 1, limit]);

        if (!routes || routes.length === 0) {
            return [];
        }

        const maxCount = routes[0].access_count;

        return routes.map(route => ({
            routeId: route.id,
            path: route.path,
            name: route.name,
            confidence: Math.round((route.access_count / maxCount) * 60), // 基于时间的预测置信度较低
            lastAccess: route.last_access,
            accessCount: route.access_count,
            averageLoadTime: route.average_load_time || 0
        }));
    }

    /**
     * 清理旧的访问历史记录（保留最近90天）
     */
    async cleanupOldHistory(): Promise<void> {
        const sql = `
            DELETE FROM route_access_history
            WHERE accessed_at < datetime('now', '-90 days')
        `;
        await this.execute(sql);
    }
}

export const routePredictionModel = new RoutePredictionModel();
