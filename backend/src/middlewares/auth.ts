/*
 * @Author: Await
 * @Date: 2025-03-12 19:24:31
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 19:56:49
 * @Description: 请填写简介
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
        role: string;
        permissions?: string[];
    };
}


export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key'
        ) as {
            id: number;
            username: string;
            email: string;
            role: string;
            permissions?: string[];
        };

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: '无效的认证令牌' });
    }
};

// 检查管理员权限
export const isAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
};
