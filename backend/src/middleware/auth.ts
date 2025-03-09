/*
 * @Author: Await
 * @Date: 2025-03-05 19:23:23
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 22:00:33
 * @Description: 请填写简介
 */
import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {findUserById} from '../models/user';

// 扩展 Request 类型以包含 user 属性
declare module 'express' {
    interface Request {
        user?: {
            id: number;
            username: string;
            email: string;
            role: 'admin' | 'user' | 'owner';
        };
    }
}

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成 JWT token
export function generateToken(user: { id: number; username: string; email: string; role: string }) {
    return jwt.sign(
        {id: user.id, username: user.username, email: user.email, role: user.role},
        JWT_SECRET,
        {expiresIn: '7d'}
    );
}

// 认证中间件
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({error: '未提供认证令牌'});
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

        const user = await findUserById(decoded.id);
        if (!user) {
            return res.status(401).json({error: '用户不存在'});
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
            return res.status(401).json({error: '无效的认证令牌'});
        }
        console.error('认证失败:', error);
        res.status(500).json({error: '认证失败'});
    }
}

// 可选的认证中间件，用于支持访客模式
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
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
        return res.status(403).json({error: '需要管理员权限'});
    }
    next();
}
