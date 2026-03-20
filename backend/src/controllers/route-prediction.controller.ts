/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 路由预测控制器
 */
import { Request, Response, NextFunction } from 'express';
import { routePredictionModel } from '../models/route-prediction';
import { APIError } from '../middleware/error';

/**
 * 预测下一个可能访问的路由
 */
export const predictNextRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const { currentRouteId, limit = 5 } = req.query;

        if (!currentRouteId) {
            // 如果没有提供当前路由，返回基于时间模式的预测
            const predictions = await routePredictionModel.predictByTimePattern(
                userId,
                parseInt(String(limit))
            );

            return res.json({
                code: 200,
                data: {
                    predictions,
                    method: 'time-based',
                    message: '基于时间模式的预测结果'
                },
                message: '预测成功'
            });
        }

        // 基于马尔可夫链的路由转移预测
        const predictions = await routePredictionModel.predictNextRoutes(
            userId,
            parseInt(String(currentRouteId)),
            parseInt(String(limit))
        );

        res.json({
            code: 200,
            data: {
                predictions,
                method: 'markov-chain',
                message: predictions.length > 0 ? '基于历史转移模式的预测结果' : '暂无足够历史数据'
            },
            message: '预测成功'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 记录路由访问
 */
export const recordRouteAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const { routeId, sessionId, previousRouteId, loadTime } = req.body;

        if (!routeId || !sessionId || loadTime === undefined) {
            throw new APIError(400, '缺少必要参数');
        }

        await routePredictionModel.recordAccess(
            parseInt(String(routeId)),
            userId,
            String(sessionId),
            previousRouteId ? parseInt(String(previousRouteId)) : null,
            parseFloat(String(loadTime))
        );

        res.json({
            code: 200,
            data: null,
            message: '访问记录成功'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 获取路由转移模式
 */
export const getTransitionPatterns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const patterns = await routePredictionModel.getTransitionPatterns(userId);

        res.json({
            code: 200,
            data: patterns,
            message: '获取转移模式成功'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 获取综合预测（结合多种算法）
 */
export const getComprehensivePredictions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const { currentRouteId } = req.query;

        // 获取基于马尔可夫链的预测
        let markovPredictions: Awaited<ReturnType<typeof routePredictionModel.predictNextRoutes>> = [];
        if (currentRouteId) {
            markovPredictions = await routePredictionModel.predictNextRoutes(
                userId,
                parseInt(String(currentRouteId)),
                3
            );
        }

        // 获取基于时间模式的预测
        const timePredictions = await routePredictionModel.predictByTimePattern(userId, 3);

        // 合并预测结果，去重并按置信度排序
        const predictionMap = new Map();

        markovPredictions.forEach(p => {
            predictionMap.set(p.routeId, {
                ...p,
                confidence: p.confidence * 0.7, // 马尔可夫预测权重70%
                methods: ['markov-chain']
            });
        });

        timePredictions.forEach(p => {
            if (predictionMap.has(p.routeId)) {
                const existing = predictionMap.get(p.routeId);
                existing.confidence = existing.confidence + p.confidence * 0.3; // 时间预测权重30%
                existing.methods.push('time-based');
            } else {
                predictionMap.set(p.routeId, {
                    ...p,
                    confidence: p.confidence * 0.3,
                    methods: ['time-based']
                });
            }
        });

        const comprehensivePredictions = Array.from(predictionMap.values())
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5)
            .map(p => ({
                ...p,
                confidence: Math.min(Math.round(p.confidence), 95) // 综合预测最高95%
            }));

        res.json({
            code: 200,
            data: {
                predictions: comprehensivePredictions,
                method: 'comprehensive',
                message: '综合多种算法的预测结果'
            },
            message: '预测成功'
        });
    } catch (error) {
        next(error);
    }
};
