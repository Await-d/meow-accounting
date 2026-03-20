/*
 * @Author: Await
 * @Date: 2025-03-09 20:45:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:47:07
 * @Description: 路由控制器
 */
import { Request, Response } from 'express';
import { routeModel } from '../models/route';
import { APIError } from '../middleware/error';
import { routePredictionModel } from '../models/route-prediction';
import { routeOptimizationModel } from '../models/route-optimization';
import { reportExportService } from '../services/report-export.service';
import { db } from '../config/database';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

function parseRouteIdsFromQuery(routeIdsQuery: unknown): number[] {
    const candidates = Array.isArray(routeIdsQuery)
        ? routeIdsQuery
        : routeIdsQuery === undefined
            ? []
            : [routeIdsQuery];

    return candidates
        .map((routeId) => (typeof routeId === 'string' ? Number.parseInt(routeId, 10) : Number.NaN))
        .filter((routeId) => Number.isFinite(routeId));
}

// 创建路由
export async function createRoute(req: Request, res: Response) {
    try {
        const { path, name, description, permission, familyId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查路由路径是否已存在
        const exists = await routeModel.routeExists(path, familyId);
        if (exists) {
            return res.status(400).json({ error: '路由路径已存在' });
        }

        // 如果是家庭路由，检查用户是否是家庭创建者
        if (familyId) {
            const isAdmin = await routeModel.canAccessRoute(familyId, userId, familyId);
            if (!isAdmin) {
                return res.status(403).json({ error: '无权创建家庭路由' });
            }
        }

        const routeId = await routeModel.createRoute(
            path,
            name,
            description,
            permission,
            userId,
            familyId
        );

        res.status(201).json({ id: routeId });
    } catch (error) {
        console.error('创建路由失败:', error);
        res.status(500).json({ error: '创建路由失败' });
    }
}

// 获取路由信息
export async function getRouteById(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;
        const familyId = req.user?.currentFamilyId ?? null;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, familyId ?? null);
        if (!canAccess) {
            return res.status(403).json({ error: '无权访问此路由' });
        }

        res.json(route);
    } catch (error) {
        console.error('获取路由信息失败:', error);
        res.status(500).json({ error: '获取路由信息失败' });
    }
}

// 获取所有路由（管理员专用）
export const getAllRoutes = async (_req: Request, res: Response) => {
    try {
        const routes = await routeModel.findMany({});

        // 将路由分类为个人路由和家庭路由
        const personalRoutes = routes.filter(route => !route.family_id);
        const familyRoutes = routes.filter(route => route.family_id);

        res.json({
            personalRoutes,
            familyRoutes
        });
    } catch (error) {
        throw new APIError(500, '获取路由列表失败');
    }
};

// 获取用户的所有路由
export const getUserRoutes = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        const routes = await routeModel.getUserRoutes(userId);
        res.json(routes);
    } catch (error) {
        throw new APIError(500, '获取用户路由失败');
    }
};

// 获取家庭的所有路由
export const getFamilyRoutes = async (req: Request, res: Response) => {
    try {
        const { familyId } = req.params;
        const routes = await routeModel.getFamilyRoutes(parseInt(familyId));
        res.json(routes);
    } catch (error) {
        throw new APIError(500, '获取家庭路由失败');
    }
};

// 更新路由
export async function updateRoute(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const { name, description, permission, is_active } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }
        const familyId = req.user?.currentFamilyId ?? null;

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查是否有权限更新
        const canAccess = await routeModel.canAccessRoute(routeId, userId, familyId);
        if (!canAccess) {
            return res.status(403).json({ error: '无权更新此路由' });
        }

        await routeModel.updateRoute(routeId, {
            name,
            description,
            permission,
            is_active
        });

        res.json({ message: '路由更新成功' });
    } catch (error) {
        console.error('更新路由失败:', error);
        res.status(500).json({ error: '更新路由失败' });
    }
}

// 删除路由
export async function deleteRoute(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;
        const familyId = req.user?.currentFamilyId ?? null;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查是否有权限删除
        const canAccess = await routeModel.canAccessRoute(routeId, userId, familyId);
        if (!canAccess) {
            return res.status(403).json({ error: '无权删除此路由' });
        }

        await routeModel.deleteRoute(routeId);
        res.json({ message: '路由删除成功' });
    } catch (error) {
        console.error('删除路由失败:', error);
        res.status(500).json({ error: '删除路由失败' });
    }
}

// 检查路由访问权限
export async function checkAccess(req: Request, res: Response) {
    try {
        const path = req.params.path;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 获取路由信息
        const route = await routeModel.getRouteByPath(path);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const hasAccess = await routeModel.checkRouteAccess(route.id, userId);
        res.json({ hasAccess });
    } catch (error) {
        console.error('检查路由访问权限失败:', error);
        res.status(500).json({ error: '检查路由访问权限失败' });
    }
}

// 切换路由状态
export async function toggleRouteActive(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            throw new APIError(401, '未登录');
        }

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            throw new APIError(404, '路由不存在');
        }

        // 检查是否有权限更新
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            throw new APIError(403, '无权更新此路由');
        }

        // 切换状态
        await routeModel.updateRoute(routeId, {
            is_active: !route.is_active
        });

        res.json({ message: '状态更新成功' });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '更新路由状态失败');
    }
}

// 获取路由性能统计
export async function getRouteStats(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            throw new APIError(401, '未登录');
        }

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            throw new APIError(404, '路由不存在');
        }

        // 检查是否有权限查看
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            throw new APIError(403, '无权查看此路由');
        }

        const statsSql = `
            SELECT
                access_count,
                error_count,
                average_load_time,
                cache_hits,
                cache_misses
            FROM route_stats
            WHERE route_id = ?
        `;

        const stats = await db.findOne<{
            access_count: number;
            error_count: number;
            average_load_time: number;
            cache_hits: number;
            cache_misses: number;
        }>(statsSql, [routeId]);

        const historyRows = await db.findMany<{
            day: string;
            avg_load_time: number;
        }>(
            `
                SELECT
                    strftime('%Y-%m-%d', accessed_at) as day,
                    AVG(load_time) as avg_load_time
                FROM route_access_history
                WHERE route_id = ? AND user_id = ?
                GROUP BY day
                ORDER BY day DESC
                LIMIT 30
            `,
            [routeId, userId]
        );

        const errorRows = await db.findMany<{ day: string; error_count: number }>(
            `
                SELECT
                    strftime('%Y-%m-%d', created_at) as day,
                    COUNT(*) as error_count
                FROM route_errors
                WHERE route_id = ?
                GROUP BY day
            `,
            [routeId]
        );

        const errorMap = new Map(errorRows.map(row => [row.day, row.error_count]));

        const accessHistory = historyRows.map(row => ({
            timestamp: row.day,
            loadTime: Number(row.avg_load_time || 0),
            errorCount: errorMap.get(row.day) || 0
        })).reverse();

        res.json({
            totalAccesses: stats?.access_count || 0,
            totalErrors: stats?.error_count || 0,
            averageLoadTime: stats?.average_load_time || 0,
            cacheHits: stats?.cache_hits || 0,
            cacheMisses: stats?.cache_misses || 0,
            accessHistory
        });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由统计失败');
    }
}

// 获取路由预测
export async function getRoutePredictions(req: Request, res: Response) {
    try {
        const userId = parseInt(req.query.user_id as string) || req.user?.id;
        
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        
        let topRoutes = await routePredictionModel.predictByTimePattern(userId, 5);

        if (!topRoutes || topRoutes.length === 0) {
            topRoutes = await routePredictionModel.getMostFrequentRoutes(userId, 5);
        }

        res.json({ topRoutes });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由预测失败');
    }
}

// 获取路由优化建议
export async function getRouteOptimizationSuggestions(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;
        
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        
        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            throw new APIError(404, '路由不存在');
        }
        
        // 检查是否有权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            throw new APIError(403, '无权查看此路由');
        }
        
        const suggestions = await routeOptimizationModel.generateSuggestions(routeId, userId);
        
        res.json(suggestions);
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由优化建议失败');
    }
}

// 导出路由分析报告
export async function exportRouteAnalysisReport(req: Request, res: Response) {
    try {
        const format = req.query.format as string || 'pdf';
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const routeIds = parseRouteIdsFromQuery(req.query['routeIds[]']);
        
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未登录');
        }

        const reportData = await buildRoutePerformanceReport(userId, {
            startDate,
            endDate,
            routeIds
        });

        // 根据格式返回不同类型的报告
        switch (format) {
            case 'pdf':
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="route-report-${new Date().toISOString().split('T')[0]}.pdf"`);
                await streamRouteReportPdf(res, reportData);
                break;
                
            case 'excel':
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="route-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
                await streamRouteReportExcel(res, reportData);
                break;
                
            case 'csv':
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="route-report-${new Date().toISOString().split('T')[0]}.csv"`);
                res.send(reportExportService.toCSV(reportData));
                break;
                
            default:
                throw new APIError(400, '不支持的导出格式');
        }
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '导出路由分析报告失败');
    }
}

// 获取路由可视化数据
export async function getRouteVisualizationData(req: Request, res: Response) {
    try {
        const type = req.query.type as string || 'performance';
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const routeIds = parseRouteIdsFromQuery(req.query['routeIds[]']);
        
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未登录');
        }

        let data: Array<Record<string, any>> = [];
        switch (type) {
            case 'performance':
                data = await getPerformanceVisualizationData(userId, routeIds);
                break;
                
            case 'distribution':
                data = await getDistributionVisualizationData(userId, { startDate, endDate, routeIds });
                break;
                
            case 'errors':
                data = await getErrorVisualizationData(userId, { startDate, endDate, routeIds });
                break;
                
            case 'cache':
                data = await getCacheVisualizationData(userId, routeIds);
                break;
                
            default:
                throw new APIError(400, '不支持的可视化数据类型');
        }
        
        res.json({ type, data });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由可视化数据失败');
    }
}

async function buildRoutePerformanceReport(
    userId: number,
    options: {
        startDate?: string;
        endDate?: string;
        routeIds?: number[];
    }
) {
    const { startDate, endDate, routeIds } = options;
    const routeIdFilter = routeIds && routeIds.length > 0;
    const timeParams: Array<string> = [];
    let timeFilterSql = '';
    if (startDate) {
        timeFilterSql += ' AND datetime(h.accessed_at) >= datetime(?)';
        timeParams.push(startDate);
    }
    if (endDate) {
        timeFilterSql += ' AND datetime(h.accessed_at) <= datetime(?)';
        timeParams.push(endDate);
    }

    let routeFilterSql = '';
    const routeParams: Array<number> = [];
    if (routeIdFilter) {
        routeFilterSql = ` AND r.id IN (${routeIds.map(() => '?').join(', ')})`;
        routeParams.push(...routeIds);
    }

    const statsSql = `
        SELECT
            r.id,
            r.path,
            r.name,
            COUNT(h.id) as access_count,
            AVG(h.load_time) as average_load_time,
            MAX(h.accessed_at) as last_access,
            COALESCE(rs.cache_hits, 0) as cache_hits,
            COALESCE(rs.cache_misses, 0) as cache_misses
        FROM routes r
        LEFT JOIN route_access_history h
            ON r.id = h.route_id
            AND h.user_id = ?
            ${timeFilterSql}
        LEFT JOIN route_stats rs ON r.id = rs.route_id
        WHERE r.user_id = ?
        ${routeFilterSql}
        GROUP BY r.id
        ORDER BY access_count DESC
    `;

    const statsParams: Array<string | number> = [userId, ...timeParams, userId, ...routeParams];
    const routeStats: Array<{
        id: number;
        path: string;
        name: string;
        access_count: number;
        average_load_time: number;
        last_access: string | null;
        cache_hits: number;
        cache_misses: number;
    }> = await db.findMany(statsSql, statsParams);

    const errorTimeParams: Array<string> = [];
    let errorTimeFilter = '';
    if (startDate) {
        errorTimeFilter += ' AND datetime(e.created_at) >= datetime(?)';
        errorTimeParams.push(startDate);
    }
    if (endDate) {
        errorTimeFilter += ' AND datetime(e.created_at) <= datetime(?)';
        errorTimeParams.push(endDate);
    }

    let errorRouteFilter = '';
    const errorRouteParams: Array<number> = [];
    if (routeIdFilter) {
        errorRouteFilter = ` AND r.id IN (${routeIds.map(() => '?').join(', ')})`;
        errorRouteParams.push(...routeIds);
    }

    const errorSql = `
        SELECT r.id as route_id, COUNT(e.id) as error_count, MAX(e.created_at) as last_error
        FROM routes r
        LEFT JOIN route_errors e ON r.id = e.route_id ${errorTimeFilter}
        WHERE r.user_id = ?
        ${errorRouteFilter}
        GROUP BY r.id
    `;

    const errorParams: Array<string | number> = [...errorTimeParams, userId, ...errorRouteParams];
    const errorRows: Array<{ route_id: number; error_count: number; last_error: string | null }> = await db.findMany(
        errorSql,
        errorParams
    );

    const errorMap = new Map<number, { error_count: number; last_error: string | null }>();
    errorRows.forEach(row => {
        errorMap.set(row.route_id, row);
    });

    let totalAccesses = 0;
    let totalErrors = 0;
    let totalLoadTime = 0;

    const details = routeStats.map(stat => {
        const errorInfo = errorMap.get(stat.id);
        const errorCount = errorInfo?.error_count || 0;
        const accessCount = stat.access_count || 0;
        const loadTime = stat.average_load_time || 0;
        const cacheHits = stat.cache_hits || 0;
        const cacheMisses = stat.cache_misses || 0;
        const hitRate = cacheHits + cacheMisses > 0
            ? (cacheHits / (cacheHits + cacheMisses)) * 100
            : 0;

        totalAccesses += accessCount;
        totalErrors += errorCount;
        totalLoadTime += loadTime * accessCount;

        return {
            路由: stat.path,
            名称: stat.name,
            访问次数: accessCount,
            错误次数: errorCount,
            平均响应时间ms: Math.round(loadTime || 0),
            缓存命中率: `${hitRate.toFixed(1)}%`,
            最后访问: stat.last_access || ''
        };
    });

    const predictions = await routePredictionModel.predictByTimePattern(userId, 10);
    const optimizationSummary = await routeOptimizationModel.getSuggestionsSummary(userId);

    return {
        metadata: {
            reportType: '路由性能分析报告',
            generatedAt: new Date().toISOString(),
            userId,
            dateRange: startDate || endDate ? {
                start: startDate || '',
                end: endDate || ''
            } : undefined
        },
        summary: {
            totalRoutes: routeStats.length,
            totalAccesses,
            totalErrors,
            averageLoadTime: totalAccesses > 0 ? Math.round(totalLoadTime / totalAccesses) : 0,
            optimizationSuggestions: optimizationSummary.unimplemented,
            topPredictions: predictions.slice(0, 3).map(p => ({
                path: p.path,
                confidence: p.confidence
            }))
        },
        details
    };
}

async function getPerformanceVisualizationData(userId: number, routeIds?: number[]) {
    const routeFilter = routeIds && routeIds.length > 0;
    const params: Array<number> = [userId];
    let routeFilterSql = '';
    if (routeFilter) {
        routeFilterSql = ` AND r.id IN (${routeIds.map(() => '?').join(', ')})`;
        params.push(...routeIds);
    }

    const sql = `
        SELECT
            r.id,
            r.path as name,
            COALESCE(rs.average_load_time, 0) as load_time,
            COALESCE(rs.error_count, 0) as error_count,
            COALESCE(rs.access_count, 0) as access_count,
            COALESCE(rs.cache_hits, 0) as cache_hits,
            COALESCE(rs.cache_misses, 0) as cache_misses
        FROM routes r
        LEFT JOIN route_stats rs ON r.id = rs.route_id
        WHERE r.user_id = ?
        ${routeFilterSql}
        ORDER BY rs.access_count DESC
    `;

    const rows: Array<{
        id: number;
        name: string;
        load_time: number;
        error_count: number;
        access_count: number;
        cache_hits: number;
        cache_misses: number;
    }> = await db.findMany(sql, params);

    return rows.map(row => {
        const errorRate = row.access_count > 0 ? (row.error_count / row.access_count) * 100 : 0;
        const cacheTotal = row.cache_hits + row.cache_misses;
        const cacheHitRate = cacheTotal > 0 ? (row.cache_hits / cacheTotal) * 100 : 0;
        return {
            id: row.id,
            name: row.name,
            loadTime: Math.round(row.load_time || 0),
            errorRate: Number(errorRate.toFixed(2)),
            cacheHitRate: Number(cacheHitRate.toFixed(1))
        };
    });
}

async function getDistributionVisualizationData(
    userId: number,
    options: { startDate?: string; endDate?: string; routeIds?: number[] }
) {
    const { startDate, endDate, routeIds } = options;
    const params: Array<string | number> = [userId];
    let timeFilter = '';
    if (startDate) {
        timeFilter += ' AND datetime(h.accessed_at) >= datetime(?)';
        params.push(startDate);
    }
    if (endDate) {
        timeFilter += ' AND datetime(h.accessed_at) <= datetime(?)';
        params.push(endDate);
    }

    let routeFilter = '';
    if (routeIds && routeIds.length > 0) {
        routeFilter = ` AND h.route_id IN (${routeIds.map(() => '?').join(', ')})`;
        params.push(...routeIds);
    }

    const sql = `
        SELECT
            strftime('%H', h.accessed_at) as hour,
            COUNT(*) as count
        FROM route_access_history h
        JOIN routes r ON r.id = h.route_id
        WHERE h.user_id = ?
        ${timeFilter}
        ${routeFilter}
        GROUP BY hour
    `;

    const rows: Array<{ hour: string; count: number }> = await db.findMany(sql, params);
    const countMap = new Map(rows.map(row => [row.hour, row.count]));

    return Array.from({ length: 24 }, (_, idx) => {
        const hour = idx < 10 ? `0${idx}` : `${idx}`;
        return {
            time: `${hour}:00`,
            count: countMap.get(hour) || 0
        };
    });
}

async function getErrorVisualizationData(
    userId: number,
    options: { startDate?: string; endDate?: string; routeIds?: number[] }
) {
    const { startDate, endDate, routeIds } = options;
    const timeParams: Array<string> = [];
    let timeFilter = '';
    if (startDate) {
        timeFilter += ' AND datetime(e.created_at) >= datetime(?)';
        timeParams.push(startDate);
    }
    if (endDate) {
        timeFilter += ' AND datetime(e.created_at) <= datetime(?)';
        timeParams.push(endDate);
    }

    let routeFilter = '';
    const routeParams: Array<number> = [];
    if (routeIds && routeIds.length > 0) {
        routeFilter = ` AND r.id IN (${routeIds.map(() => '?').join(', ')})`;
        routeParams.push(...routeIds);
    }

    const sql = `
        SELECT
            r.id,
            r.path,
            COUNT(e.id) as error_count,
            MAX(e.created_at) as last_error,
            COALESCE(rs.access_count, 0) as access_count
        FROM routes r
        LEFT JOIN route_errors e ON r.id = e.route_id ${timeFilter}
        LEFT JOIN route_stats rs ON r.id = rs.route_id
        WHERE r.user_id = ?
        ${routeFilter}
        GROUP BY r.id
        ORDER BY error_count DESC
    `;

    const params: Array<string | number> = [...timeParams, userId, ...routeParams];
    const rows: Array<{ id: number; path: string; error_count: number; last_error: string | null; access_count: number }> = await db.findMany(
        sql,
        params
    );

    return rows.map(row => ({
        id: row.id,
        path: row.path,
        errorCount: row.error_count,
        errorRate: row.access_count > 0 ? Number(((row.error_count / row.access_count) * 100).toFixed(2)) : 0,
        lastError: row.last_error
    }));
}

async function getCacheVisualizationData(userId: number, routeIds?: number[]) {
    const params: Array<number> = [userId];
    let routeFilter = '';
    if (routeIds && routeIds.length > 0) {
        routeFilter = ` AND r.id IN (${routeIds.map(() => '?').join(', ')})`;
        params.push(...routeIds);
    }

    const sql = `
        SELECT
            r.id,
            r.path,
            COALESCE(rs.cache_hits, 0) as cache_hits,
            COALESCE(rs.cache_misses, 0) as cache_misses
        FROM routes r
        LEFT JOIN route_stats rs ON r.id = rs.route_id
        WHERE r.user_id = ?
        ${routeFilter}
        ORDER BY r.path ASC
    `;

    const rows: Array<{ id: number; path: string; cache_hits: number; cache_misses: number }> = await db.findMany(sql, params);

    return rows.map(row => {
        const total = row.cache_hits + row.cache_misses;
        const hitRate = total > 0 ? (row.cache_hits / total) * 100 : 0;
        return {
            id: row.id,
            path: row.path,
            cacheHits: row.cache_hits,
            cacheMisses: row.cache_misses,
            hitRate: Number(hitRate.toFixed(1))
        };
    });
}

async function streamRouteReportExcel(res: Response, reportData: any) {
    const workbook = new ExcelJS.Workbook();
    const summarySheet = workbook.addWorksheet('概览');
    const detailSheet = workbook.addWorksheet('详情');

    summarySheet.addRow(['报告类型', reportData.metadata.reportType]);
    summarySheet.addRow(['生成时间', reportData.metadata.generatedAt]);
    if (reportData.metadata.dateRange) {
        summarySheet.addRow(['开始时间', reportData.metadata.dateRange.start]);
        summarySheet.addRow(['结束时间', reportData.metadata.dateRange.end]);
    }
    summarySheet.addRow([]);
    summarySheet.addRow(['总路由数', reportData.summary.totalRoutes]);
    summarySheet.addRow(['总访问量', reportData.summary.totalAccesses]);
    summarySheet.addRow(['总错误数', reportData.summary.totalErrors]);
    summarySheet.addRow(['平均响应时间(ms)', reportData.summary.averageLoadTime]);

    const detailRows = reportData.details || [];
    if (detailRows.length > 0) {
        const headers = Object.keys(detailRows[0]);
        detailSheet.addRow(headers);
        detailRows.forEach((row: Record<string, any>) => {
            const values = headers.map(header => row[header]);
            detailSheet.addRow(values);
        });
    }

    await workbook.xlsx.write(res);
    res.end();
}

async function streamRouteReportPdf(res: Response, reportData: any) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).text(reportData.metadata.reportType, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`生成时间: ${reportData.metadata.generatedAt}`);
    if (reportData.metadata.dateRange) {
        doc.text(`日期范围: ${reportData.metadata.dateRange.start || '-'} 至 ${reportData.metadata.dateRange.end || '-'}`);
    }
    doc.moveDown();

    doc.fontSize(12).text('摘要');
    doc.fontSize(10);
    for (const key in reportData.summary) {
        if (!Object.prototype.hasOwnProperty.call(reportData.summary, key)) continue;
        const value = reportData.summary[key];
        doc.text(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    }

    doc.moveDown();
    doc.fontSize(12).text('详情');
    doc.fontSize(9);

    const details = reportData.details || [];
    details.slice(0, 50).forEach((row: Record<string, any>) => {
        const parts: string[] = [];
        for (const key in row) {
            if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
            parts.push(`${key}: ${row[key]}`);
        }
        doc.text(parts.join(' | '));
    });

    if (details.length > 50) {
        doc.moveDown();
        doc.text(`仅展示前50条记录，实际总数 ${details.length} 条。`);
    }

    doc.end();
}
