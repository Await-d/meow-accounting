/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 路由优化建议控制器
 */
import { Request, Response, NextFunction } from 'express';
import { routeOptimizationModel } from '../models/route-optimization';
import { APIError } from '../middleware/error';

/**
 * 生成路由优化建议
 */
export const generateOptimizationSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const routeId = parseInt(req.params.id);
        if (!routeId) {
            throw new APIError(400, '缺少路由ID');
        }

        const suggestions = await routeOptimizationModel.generateSuggestions(routeId, userId);

        res.json({
            code: 200,
            data: suggestions,
            message: `成功生成 ${suggestions.length} 条优化建议`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 获取路由的优化建议
 */
export const getOptimizationSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const routeId = parseInt(req.params.id);
        if (!routeId) {
            throw new APIError(400, '缺少路由ID');
        }

        const suggestions = await routeOptimizationModel.getSuggestionsByRoute(routeId);

        res.json({
            code: 200,
            data: suggestions,
            message: '获取优化建议成功'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 标记建议为已实施
 */
export const markSuggestionImplemented = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const suggestionId = parseInt(req.params.suggestionId);
        if (!suggestionId) {
            throw new APIError(400, '缺少建议ID');
        }

        await routeOptimizationModel.markAsImplemented(suggestionId);

        res.json({
            code: 200,
            data: null,
            message: '已标记为已实施'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 获取优化建议摘要
 */
export const getOptimizationSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const summary = await routeOptimizationModel.getSuggestionsSummary(userId);

        res.json({
            code: 200,
            data: summary,
            message: '获取优化建议摘要成功'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 批量生成所有路由的优化建议
 */
export const generateAllSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        // 获取用户所有路由
        const routesSql = `SELECT id FROM routes WHERE user_id = ?`;
        const db = require('../config/database').default;
        const routes = await new Promise<any[]>((resolve, reject) => {
            db.all(routesSql, [userId], (err: any, rows: any[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        let totalSuggestions = 0;
        for (const route of routes) {
            const suggestions = await routeOptimizationModel.generateSuggestions(route.id, userId);
            totalSuggestions += suggestions.length;
        }

        res.json({
            code: 200,
            data: {
                routeCount: routes.length,
                suggestionCount: totalSuggestions
            },
            message: `成功为 ${routes.length} 个路由生成 ${totalSuggestions} 条优化建议`
        });
    } catch (error) {
        next(error);
    }
};
