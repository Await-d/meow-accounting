/*
 * @Author: Await
 * @Date: 2025-03-05 20:47:37
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 16:26:37
 * @Description: 请填写简介
 */
import { Request, Response, NextFunction } from 'express';
import * as familyModel from '../models/family';

// 验证用户是否是家庭成员
export const familyMemberMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 获取当前登录用户ID
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: '未授权访问' });
        }

        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

        // 如果是个人数据查询，确保只能查询自己的数据
        if (req.query.user_id) {
            const requestedUserId = parseInt(req.query.user_id as string);

            // 验证请求的user_id是否与当前登录用户ID匹配
            if (requestedUserId !== userIdNum) {
                return res.status(403).json({ message: '无权访问其他用户的数据' });
            }

            return next();
        }

        // 从查询参数中获取family_id
        const familyId = req.query.family_id ? parseInt(req.query.family_id as string) : undefined;

        // 如果没有家庭ID，跳过检查
        if (!familyId) {
            return next();
        }

        if (isNaN(familyId)) {
            console.error('无效的家庭ID:', req.query.family_id);
            return res.status(400).json({ message: '无效的家庭ID' });
        }

        // 检查用户是否是该家庭的成员
        const isMember = await familyModel.isFamilyMember(familyId, userIdNum);

        if (!isMember) {
            return res.status(403).json({ message: '您不是该家庭的成员' });
        }

        next();
    } catch (error) {
        console.error('检查家庭成员权限时出错:', error);
        res.status(500).json({ message: '服务器错误' });
    }
};

// 验证用户是否是家庭管理员
export async function familyAdminMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
        const familyId = parseInt(req.params.familyId || req.body.familyId);

        if (!familyId || isNaN(familyId)) {
            return res.status(400).json({ error: '无效的家庭ID' });
        }

        const isAdmin = await familyModel.isFamilyAdmin(familyId, userIdNum);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权执行此操作' });
        }

        next();
    } catch (error) {
        console.error('验证家庭管理员权限失败:', error);
        res.status(500).json({ error: '验证家庭管理员权限失败' });
    }
}

// 验证用户是否是家庭所有者
export async function familyOwnerMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }
        const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
        const familyId = parseInt(req.params.familyId || req.body.familyId);

        if (!familyId || isNaN(familyId)) {
            return res.status(400).json({ error: '无效的家庭ID' });
        }

        const family = await familyModel.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({ error: '家庭不存在' });
        }

        if (family.owner_id !== userIdNum) {
            return res.status(403).json({ error: '无权执行此操作' });
        }

        next();
    } catch (error) {
        console.error('验证家庭所有者权限失败:', error);
        res.status(500).json({ error: '验证家庭所有者权限失败' });
    }
}
