/*
 * @Author: Await
 * @Date: 2025-03-15 19:20:40
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:25:03
 * @Description: 认证中间件
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSecretKey } from '../config/auth';

// 扩展Request类型，添加user属性
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
                email: string;
                role: string;
            };
        }
    }
}

/**
 * 认证中间件 - 验证用户的JWT令牌
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 从请求头中获取token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: '未提供认证Token' });
        }

        // 验证token格式
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(401).json({ error: '无效的认证Token格式' });
        }

        const token = tokenParts[1];
        const secretKey = getSecretKey();

        // 验证token
        const decoded = jwt.verify(token, secretKey) as {
            id: number;
            username: string;
            email: string;
            role: string;
        };

        // 将解码后的用户信息存储在请求对象中
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token已过期，请重新登录' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: '无效的Token' });
        } else {
            console.error('认证失败:', error);
            return res.status(500).json({ error: '认证失败' });
        }
    }
}; 