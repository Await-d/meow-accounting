/*
 * @Author: Await
 * @Date: 2025-03-09 10:08:58
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 18:42:55
 * @Description: 请填写简介
 */
import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';

// 检查用户是否具有管理员角色
export const checkAdminRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: '未授权访问' });
        }

        const userId = typeof req.user.id === 'string' ? parseInt(req.user.id) : req.user.id;

        const user = await db.findOne<{ role: string }>('SELECT role FROM users WHERE id = ?', [userId]);

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: '权限不足，需要管理员权限' });
        }

        next();
    } catch (error) {
        console.error('检查管理员权限时出错:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};
