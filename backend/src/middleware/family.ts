/*
 * @Author: Await
 * @Date: 2025-03-05 20:47:37
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 11:38:13
 * @Description: 请填写简介
 */
import {Request, Response, NextFunction} from 'express';
import * as familyModel from '../models/family';

// 验证用户是否是家庭成员
export const familyMemberMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const familyId = parseInt(req.params.familyId);
        const userId = req.user?.id;

        console.log('familyMemberMiddleware - familyId:', familyId, 'userId:', userId);

        if (!userId) {
            return res.status(401).json({message: '未授权访问'});
        }

        if (isNaN(familyId)) {
            console.error('无效的家庭ID:', req.params.familyId);
            return res.status(400).json({message: '无效的家庭ID'});
        }

        // 检查用户是否是该家庭的成员
        const isMember = await familyModel.isFamilyMember(familyId, userId);

        if (!isMember) {
            return res.status(403).json({message: '您不是该家庭的成员'});
        }

        next();
    } catch (error) {
        console.error('检查家庭成员权限时出错:', error);
        res.status(500).json({message: '服务器错误'});
    }
};

// 验证用户是否是家庭管理员
export async function familyAdminMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const familyId = parseInt(req.params.familyId || req.body.familyId);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        if (!familyId || isNaN(familyId)) {
            return res.status(400).json({error: '无效的家庭ID'});
        }

        const isAdmin = await familyModel.isFamilyAdmin(familyId, userId);
        if (!isAdmin) {
            return res.status(403).json({error: '无权执行此操作'});
        }

        next();
    } catch (error) {
        console.error('验证家庭管理员权限失败:', error);
        res.status(500).json({error: '验证家庭管理员权限失败'});
    }
}

// 验证用户是否是家庭所有者
export async function familyOwnerMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const familyId = parseInt(req.params.familyId || req.body.familyId);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        if (!familyId || isNaN(familyId)) {
            return res.status(400).json({error: '无效的家庭ID'});
        }

        const family = await familyModel.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({error: '家庭不存在'});
        }

        if (family.owner_id !== userId) {
            return res.status(403).json({error: '无权执行此操作'});
        }

        next();
    } catch (error) {
        console.error('验证家庭所有者权限失败:', error);
        res.status(500).json({error: '验证家庭所有者权限失败'});
    }
}
