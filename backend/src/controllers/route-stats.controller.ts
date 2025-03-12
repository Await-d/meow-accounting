/*
 * @Author: Await
 * @Date: 2025-03-10 21:33:48
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 20:53:38
 * @Description: 请填写简介
 */
import { Request, Response } from 'express';
import { routeStatsModel } from '../models/route-stats';
import { RecordRouteAccessData, PerformanceReport } from '../types/index';

// 记录路由访问
export async function recordAccess(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const data: RecordRouteAccessData = req.body;
        await routeStatsModel.recordAccess(data);

        res.json({ message: '记录成功' });
    } catch (error) {
        console.error('记录路由访问失败:', error);
        res.status(500).json({ error: '记录路由访问失败' });
    }
}

// 获取性能报告
export async function getPerformanceReport(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const { start_date, end_date } = req.query;
        const report = await routeStatsModel.getPerformanceReport(userId);

        res.json(report);
    } catch (error) {
        console.error('获取性能报告失败:', error);
        res.status(500).json({ error: '获取性能报告失败' });
    }
}

// 清除性能数据
export async function clearPerformanceData(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const routeId = parseInt(req.params.routeId);
        await routeStatsModel.clearPerformanceData(routeId, userId);

        res.json({ message: '性能数据已清除' });
    } catch (error) {
        console.error('清除性能数据失败:', error);
        res.status(500).json({ error: '清除性能数据失败' });
    }
}

// 获取路由缓存统计
export async function getCacheStats(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const routeId = parseInt(req.params.routeId);
        const stats = await routeStatsModel.getCacheStats(routeId);

        res.json(stats);
    } catch (error) {
        console.error('获取缓存统计失败:', error);
        res.status(500).json({ error: '获取缓存统计失败' });
    }
}

// 获取预热状态
export async function getPreheatStatus(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const status = await routeStatsModel.getPreheatStatus(userId);
        res.json(status);
    } catch (error) {
        console.error('获取预热状态失败:', error);
        res.status(500).json({ error: '获取预热状态失败' });
    }
}
