/*
 * @Author: Await
 * @Date: 2025-03-05 19:23:23
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 20:16:31
 * @Description: 请填写简介
 */
import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {getSecretKey} from '../config/auth';

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

// 从数据库查询用户
async function getUserById(id: number) {
    // 引入用户模型
    const {getUserById: findUserById} = await import('../models/user');

    try {
        // 从数据库查询用户
        const user = await findUserById(id);

        // 如果用户不存在，返回null
        if (!user) {
            return null;
        }

        // 返回用户信息，排除密码等敏感字段
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || 'user',
            avatar: user.avatar
        };
    } catch (error) {
        console.error('查询用户失败:', error);
        throw error;
    }
}

// 认证中间件 - 验证Token并将用户信息添加到req对象
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 获取请求头中的token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({message: '未提供认证令牌'});
    }

    // 验证token格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({message: '认证令牌格式不正确'});
    }

    const token = parts[1];

    try {
        // 验证token
        const secretKey = getSecretKey();
        const payload = jwt.verify(token, secretKey) as { id: number };

        // 查询用户信息
        const user = await getUserById(payload.id);

        if (!user) {
            return res.status(401).json({message: '用户不存在'});
        }

        // 将用户信息添加到请求对象
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({message: '认证令牌已过期'});
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({message: '无效的认证令牌'});
        }

        console.error('认证失败:', error);
        return res.status(500).json({message: '服务器内部错误'});
    }
};

// 管理员权限中间件
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({error: '需要管理员权限'});
    }
    next();
}

// 角色检查中间件
export const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({error: '未登录或无角色信息'});
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({error: '无权限访问'});
        }

        next();
    };
};
