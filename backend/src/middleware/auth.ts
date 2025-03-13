/*
 * @Author: Await
 * @Date: 2025-03-05 19:23:23
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 20:01:03
 * @Description: 请填写简介
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../models/user';

// 扩展 Request 类型以包含 user 属性
declare module 'express' {
    interface Request {
        user?: {
            id: number;
            username: string;
            email: string;
            role: string;
            permissions?: string[];
            currentFamilyId?: number;
        };
    }
}

interface TokenUser {
    id: number;
    username: string;
    email: string;
    role: string;
    permissions?: string[];
    nickname?: string;
    avatar?: string;
    currentFamilyId?: number;
    settings?: Record<string, any>;
}

// 生成 JWT token
export function generateToken(user: TokenUser): string {
    return jwt.sign(user, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '24h'
    });
}

// 认证中间件
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };

        const user = await findUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: '用户不存在' });
        }

        // 将用户信息添加到请求对象
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: '无效的认证令牌' });
        }
        console.error('认证失败:', error);
        res.status(500).json({ error: '认证失败' });
    }
}

// 可选的认证中间件，用于支持访客模式
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: number };
            const user = await findUserById(decoded.id);

            if (user) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                };
            }
        }

        next();
    } catch (error) {
        // 即使认证失败也继续执行
        next();
    }
}

// 管理员权限中间件
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
}

// 角色检查中间件
export const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: '未登录或无角色信息' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: '无权限访问' });
        }

        next();
    };
};
