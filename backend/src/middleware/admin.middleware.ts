/*
 * @Author: Await
 * @Date: 2025-03-15 19:30:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 19:30:10
 * @Description: 管理员权限中间件
 */
import { Request, Response, NextFunction } from 'express';

/**
 * 检查用户是否具有管理员权限的中间件
 */
export const checkAdminRole = (req: Request, res: Response, next: NextFunction) => {
    // 需要先通过认证中间件
    if (!req.user) {
        return res.status(401).json({ error: '未认证，请先登录' });
    }

    // 检查用户角色
    const { role } = req.user;
    if (role !== 'admin' && role !== 'owner') {
        return res.status(403).json({ error: '权限不足，需要管理员权限' });
    }

    // 用户具有管理员权限，继续执行下一个中间件
    next();
}; 