import { Request, Response } from 'express';
import * as routeParamsModel from '../models/route-params';
import { routeModel } from '../models/route';

// 保存路由参数
export async function saveParams(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const routeId = parseInt(req.params.routeId);
        const { params } = req.body;

        // 检查路由是否存在
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            return res.status(403).json({ error: '无权访问此路由' });
        }

        await routeParamsModel.saveParams(routeId, userId, params);
        res.json({ message: '参数保存成功' });
    } catch (error) {
        console.error('保存路由参数失败:', error);
        res.status(500).json({ error: '保存路由参数失败' });
    }
}

// 获取路由参数
export async function getParams(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const routeId = parseInt(req.params.routeId);

        // 检查路由是否存在
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            return res.status(403).json({ error: '无权访问此路由' });
        }

        const params = await routeParamsModel.getParams(routeId, userId);
        res.json({ params });
    } catch (error) {
        console.error('获取路由参数失败:', error);
        res.status(500).json({ error: '获取路由参数失败' });
    }
}

// 清除路由参数
export async function clearParams(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const routeId = parseInt(req.params.routeId);

        // 检查路由是否存在
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            return res.status(403).json({ error: '无权访问此路由' });
        }

        await routeParamsModel.clearParams(routeId, userId);
        res.json({ message: '参数清除成功' });
    } catch (error) {
        console.error('清除路由参数失败:', error);
        res.status(500).json({ error: '清除路由参数失败' });
    }
}

// 获取用户所有路由参数
export async function getAllParams(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const params = await routeParamsModel.getAllParams(userId);
        res.json({ params });
    } catch (error) {
        console.error('获取所有路由参数失败:', error);
        res.status(500).json({ error: '获取所有路由参数失败' });
    }
}
