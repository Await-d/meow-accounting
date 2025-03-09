import {Request, Response, NextFunction} from 'express';
import {prisma} from '../db';

// 检查用户是否具有管理员角色
export const checkAdminRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({message: '未授权访问'});
        }

        const user = await prisma.user.findUnique({
            where: {id: req.user.id},
            select: {role: true}
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({message: '权限不足，需要管理员权限'});
        }

        next();
    } catch (error) {
        console.error('检查管理员权限时出错:', error);
        res.status(500).json({message: '服务器错误'});
    }
};
