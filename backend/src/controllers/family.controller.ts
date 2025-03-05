import { Request, Response } from 'express';
import * as familyModel from '../models/family';
import { validateFamily } from '../utils/validation';

// 创建家庭
export async function createFamily(req: Request, res: Response) {
    try {
        const { name, description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 验证输入
        const validationError = validateFamily(name, description);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const familyId = await familyModel.createFamily(name, description, userId);
        res.status(201).json({ id: familyId });
    } catch (error) {
        console.error('创建家庭失败:', error);
        res.status(500).json({ error: '创建家庭失败' });
    }
}

// 获取家庭信息
export async function getFamilyById(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是家庭成员
        const isMember = await familyModel.isFamilyMember(familyId, userId);
        if (!isMember) {
            return res.status(403).json({ error: '无权访问此家庭' });
        }

        const family = await familyModel.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({ error: '家庭不存在' });
        }

        res.json(family);
    } catch (error) {
        console.error('获取家庭信息失败:', error);
        res.status(500).json({ error: '获取家庭信息失败' });
    }
}

// 获取用户的所有家庭
export async function getUserFamilies(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const families = await familyModel.getUserFamilies(userId);
        res.json(families);
    } catch (error) {
        console.error('获取用户家庭列表失败:', error);
        res.status(500).json({ error: '获取用户家庭列表失败' });
    }
}

// 获取家庭成员
export async function getFamilyMembers(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是家庭成员
        const isMember = await familyModel.isFamilyMember(familyId, userId);
        if (!isMember) {
            return res.status(403).json({ error: '无权访问此家庭' });
        }

        const members = await familyModel.getFamilyMembers(familyId);
        res.json(members);
    } catch (error) {
        console.error('获取家庭成员列表失败:', error);
        res.status(500).json({ error: '获取家庭成员列表失败' });
    }
}

// 添加家庭成员
export async function addFamilyMember(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const { userId, role } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, currentUserId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权添加成员' });
        }

        await familyModel.addFamilyMember(familyId, userId, role);
        res.status(201).json({ message: '成员添加成功' });
    } catch (error) {
        console.error('添加家庭成员失败:', error);
        res.status(500).json({ error: '添加家庭成员失败' });
    }
}

// 更新成员角色
export async function updateMemberRole(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const { userId, role } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, currentUserId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权更新成员角色' });
        }

        await familyModel.updateMemberRole(familyId, userId, role);
        res.json({ message: '角色更新成功' });
    } catch (error) {
        console.error('更新成员角色失败:', error);
        res.status(500).json({ error: '更新成员角色失败' });
    }
}

// 移除家庭成员
export async function removeFamilyMember(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, currentUserId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权移除成员' });
        }

        await familyModel.removeFamilyMember(familyId, userId);
        res.json({ message: '成员移除成功' });
    } catch (error) {
        console.error('移除家庭成员失败:', error);
        res.status(500).json({ error: '移除家庭成员失败' });
    }
} 