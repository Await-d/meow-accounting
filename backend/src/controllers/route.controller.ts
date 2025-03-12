/*
 * @Author: Await
 * @Date: 2025-03-09 20:45:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 20:18:39
 * @Description: 路由控制器
 */
import { Request, Response } from 'express';
import { routeModel, Route } from '../models/route';
import * as familyModel from '../models/family';
import { RoutePermission } from '../types';
import { APIError } from '../middlewares/error';

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
export const getAllRoutes = async (req: Request, res: Response) => {
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
