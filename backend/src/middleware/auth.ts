import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

export async function auth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        const user = await findUserById(decoded.id);

        if (!user) {
            throw new Error();
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        next();
    } catch (error) {
        res.status(401).json({ error: '请先登录' });
    }
}

export function generateToken(userId: number): string {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// 可选的认证中间件，用于支持访客模式
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
            const user = await findUserById(decoded.id);

            if (user) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email
                };
            }
        }

        next();
    } catch (error) {
        // 即使认证失败也继续执行
        next();
    }
} 