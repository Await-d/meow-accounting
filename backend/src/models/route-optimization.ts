/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 路由性能优化建议模型
 */
import { BaseModel } from './base.model';
import { routeStatsModel } from './route-stats';

interface OptimizationSuggestion {
    id: number;
    route_id: number;
    suggestion_type: string;
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'caching' | 'error' | 'other';
    title: string;
    description: string;
    impact: string;
    implemented: boolean;
    created_at: string;
    updated_at: string;
}

interface SuggestionData {
    route_id: number;
    suggestion_type: string;
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'caching' | 'error' | 'other';
    title: string;
    description: string;
    impact: string;
}

export class RouteOptimizationModel extends BaseModel<OptimizationSuggestion> {
    constructor() {
        super('route_optimization_suggestions');
    }

    /**
     * 为路由生成优化建议
     */
    async generateSuggestions(routeId: number, userId: number): Promise<OptimizationSuggestion[]> {
        // 获取路由统计数据
        const statsSql = `
            SELECT rs.*, r.path, r.name
            FROM route_stats rs
            JOIN routes r ON rs.route_id = r.id
            WHERE rs.route_id = ? AND r.user_id = ?
        `;
        const stats = await this.execute<Array<any>>(statsSql, [routeId, userId]);

        if (!stats || stats.length === 0) {
            return [];
        }

        const routeStats = stats[0];
        const suggestions: SuggestionData[] = [];

        // 1. 性能优化建议
        if (routeStats.average_load_time > 1000) {
            suggestions.push({
                route_id: routeId,
                suggestion_type: 'slow_response',
                priority: 'high',
                category: 'performance',
                title: '响应时间过长',
                description: `路由 ${routeStats.path} 的平均响应时间为 ${routeStats.average_load_time.toFixed(0)}ms，超过了1秒的阈值。建议检查数据库查询效率、API调用性能或考虑添加缓存。`,
                impact: `优化后预计可提升用户体验，减少 ${Math.round((routeStats.average_load_time - 500) / routeStats.average_load_time * 100)}% 的等待时间`
            });
        } else if (routeStats.average_load_time > 500) {
            suggestions.push({
                route_id: routeId,
                suggestion_type: 'moderate_response',
                priority: 'medium',
                category: 'performance',
                title: '响应时间可优化',
                description: `路由 ${routeStats.path} 的平均响应时间为 ${routeStats.average_load_time.toFixed(0)}ms。虽然在可接受范围内，但仍有优化空间。`,
                impact: '优化后可进一步提升用户体验'
            });
        }

        // 2. 缓存建议
        const cacheHitRate = routeStats.cache_hits / (routeStats.cache_hits + routeStats.cache_misses);
        if (routeStats.access_count > 10) {
            if (cacheHitRate < 0.3) {
                suggestions.push({
                    route_id: routeId,
                    suggestion_type: 'low_cache_hit',
                    priority: 'high',
                    category: 'caching',
                    title: '缓存命中率过低',
                    description: `路由 ${routeStats.path} 的缓存命中率仅为 ${(cacheHitRate * 100).toFixed(1)}%。建议增加缓存策略或扩大缓存容量。`,
                    impact: `提升缓存命中率至70%可减少约 ${Math.round((0.7 - cacheHitRate) * routeStats.access_count)} 次数据库查询`
                });
            } else if (cacheHitRate < 0.6) {
                suggestions.push({
                    route_id: routeId,
                    suggestion_type: 'moderate_cache_hit',
                    priority: 'medium',
                    category: 'caching',
                    title: '缓存命中率可提升',
                    description: `路由 ${routeStats.path} 的缓存命中率为 ${(cacheHitRate * 100).toFixed(1)}%，有提升空间。`,
                    impact: '优化缓存策略可进一步降低服务器负载'
                });
            }
        } else if (routeStats.access_count > 5 && routeStats.cache_hits === 0) {
            suggestions.push({
                route_id: routeId,
                suggestion_type: 'no_cache',
                priority: 'medium',
                category: 'caching',
                title: '建议启用缓存',
                description: `路由 ${routeStats.path} 被访问了 ${routeStats.access_count} 次但未使用缓存。建议为该路由启用缓存以提升性能。`,
                impact: '启用缓存后预计可减少50-80%的响应时间'
            });
        }

        // 3. 错误率建议
        const errorRate = routeStats.error_count / routeStats.access_count;
        if (errorRate > 0.1) {
            suggestions.push({
                route_id: routeId,
                suggestion_type: 'high_error_rate',
                priority: 'high',
                category: 'error',
                title: '错误率过高',
                description: `路由 ${routeStats.path} 的错误率为 ${(errorRate * 100).toFixed(1)}%，已发生 ${routeStats.error_count} 次错误。需要立即排查并修复。`,
                impact: '修复错误可大幅提升系统稳定性和用户满意度'
            });
        } else if (errorRate > 0.05) {
            suggestions.push({
                route_id: routeId,
                suggestion_type: 'moderate_error_rate',
                priority: 'medium',
                category: 'error',
                title: '存在一定错误率',
                description: `路由 ${routeStats.path} 的错误率为 ${(errorRate * 100).toFixed(1)}%。建议增强错误处理和输入验证。`,
                impact: '降低错误率可提升系统可靠性'
            });
        }

        // 4. 访问模式建议
        if (routeStats.access_count > 100) {
            const recentAccessSql = `
                SELECT COUNT(*) as recent_count
                FROM route_access_history
                WHERE route_id = ? AND accessed_at > datetime('now', '-7 days')
            `;
            const recentAccess = await this.execute<[{ recent_count: number }]>(recentAccessSql, [routeId]);

            if (recentAccess && recentAccess[0].recent_count > 50) {
                suggestions.push({
                    route_id: routeId,
                    suggestion_type: 'high_traffic',
                    priority: 'low',
                    category: 'other',
                    title: '高频访问路由',
                    description: `路由 ${routeStats.path} 是高频访问路由（最近7天访问 ${recentAccess[0].recent_count} 次）。建议考虑负载均衡或CDN加速。`,
                    impact: '优化高频路由可显著提升整体系统性能'
                });
            }
        }

        // 5. 数据库查询优化建议
        if (routeStats.average_load_time > 800 && errorRate < 0.05) {
            suggestions.push({
                route_id: routeId,
                suggestion_type: 'database_optimization',
                priority: 'medium',
                category: 'performance',
                title: '数据库查询可能需要优化',
                description: `路由 ${routeStats.path} 响应较慢但错误率低，可能是数据库查询效率问题。建议检查SQL查询、添加索引或使用查询优化工具。`,
                impact: '优化查询可减少50-70%的响应时间'
            });
        }

        // 保存建议到数据库
        const savedSuggestions: OptimizationSuggestion[] = [];
        for (const suggestion of suggestions) {
            // ��查是否已存在相同类型的建议
            const existingSql = `
                SELECT * FROM route_optimization_suggestions
                WHERE route_id = ? AND suggestion_type = ? AND implemented = 0
            `;
            const existing = await this.execute<OptimizationSuggestion[]>(
                existingSql,
                [suggestion.route_id, suggestion.suggestion_type]
            );

            if (!existing || existing.length === 0) {
                const insertSql = `
                    INSERT INTO route_optimization_suggestions (
                        route_id, suggestion_type, priority, category,
                        title, description, impact
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                const result = await this.execute<any>(insertSql, [
                    suggestion.route_id,
                    suggestion.suggestion_type,
                    suggestion.priority,
                    suggestion.category,
                    suggestion.title,
                    suggestion.description,
                    suggestion.impact
                ]);

                savedSuggestions.push({
                    id: result.lastID,
                    ...suggestion,
                    implemented: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            } else {
                savedSuggestions.push(existing[0]);
            }
        }

        return savedSuggestions;
    }

    /**
     * 获取路由的所有建议
     */
    async getSuggestionsByRoute(routeId: number): Promise<OptimizationSuggestion[]> {
        const sql = `
            SELECT * FROM route_optimization_suggestions
            WHERE route_id = ?
            ORDER BY
                CASE priority
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                END,
                created_at DESC
        `;
        return this.execute<OptimizationSuggestion[]>(sql, [routeId]);
    }

    /**
     * 标记建议为已实施
     */
    async markAsImplemented(suggestionId: number): Promise<void> {
        const sql = `
            UPDATE route_optimization_suggestions
            SET implemented = 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        await this.execute(sql, [suggestionId]);
    }

    /**
     * 获取用户所有路由的优化建议摘要
     */
    async getSuggestionsSummary(userId: number): Promise<{
        total: number;
        byPriority: Record<string, number>;
        byCategory: Record<string, number>;
        unimplemented: number;
    }> {
        const sql = `
            SELECT
                s.*
            FROM route_optimization_suggestions s
            JOIN routes r ON s.route_id = r.id
            WHERE r.user_id = ?
        `;
        const rawResult = await this.execute<OptimizationSuggestion[]>(sql, [userId]);
        const suggestions: OptimizationSuggestion[] = Array.isArray(rawResult) ? rawResult : (rawResult ? [rawResult as any] : []);

        const summary = {
            total: suggestions.length,
            byPriority: { high: 0, medium: 0, low: 0 },
            byCategory: { performance: 0, caching: 0, error: 0, other: 0 },
            unimplemented: 0
        };

        suggestions.forEach(s => {
            summary.byPriority[s.priority]++;
            summary.byCategory[s.category]++;
            if (!s.implemented) {
                summary.unimplemented++;
            }
        });

        return summary;
    }
}

export const routeOptimizationModel = new RouteOptimizationModel();
