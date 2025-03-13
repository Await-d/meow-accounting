/*
 * @Author: Await
 * @Date: 2025-03-05 19:37:11
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 18:29:17
 * @Description: 请填写简介
 */
import { Request, Response } from 'express';
import * as userModel from '../models/user';
import bcrypt from 'bcrypt';
import { validatePassword } from '../utils/validation';

// 通过邮箱查找用户
export async function findUserByEmail(req: Request, res: Response) {
    try {
        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: '邮箱参数无效' });
        }

        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 只返回必要的信息
        res.json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('查找用户失败:', error);
        res.status(500).json({ error: '查找用户失败' });
    }
}

// 更新用户信息
export async function updateProfile(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { username } = req.body;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (!username) {
            return res.status(400).json({ error: '用户名不能为空' });
        }

        await userModel.updateUser(userId, { username });
        const updatedUser = await userModel.findUserById(userId);

        if (!updatedUser) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role
        });
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({ error: '更新用户信息失败' });
    }
}

// 修改密码
export async function changePassword(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: '当前密码和新密码都不能为空' });
        }

        // 验证新密码强度
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ error: '新密码必须至少包含8个字符' });
        }

        // 获取用户信息
        const user = await userModel.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 验证当前密码
        const isValid = await userModel.verifyPassword(user, currentPassword);
        if (!isValid) {
            return res.status(401).json({ error: '当前密码错误' });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updateUser(userId, { password: hashedPassword });

        res.json({ message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ error: '修改密码失败' });
    }
}

// 更新隐私设置
export async function updatePrivacySettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { privacy_mode, guest_password } = req.body;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (privacy_mode === undefined) {
            return res.status(400).json({ error: '隐私模式设置不能为空' });
        }

        // 如果启用隐私模式，必须设置访客密码
        if (privacy_mode && !guest_password) {
            return res.status(400).json({ error: '启用隐私模式时必须设置访客密码' });
        }

        // 如果提供了访客密码，加密保存
        let hashedGuestPassword = undefined;
        if (guest_password) {
            hashedGuestPassword = await bcrypt.hash(guest_password, 10);
        }

        await userModel.updateUser(userId, {
            privacy_mode,
            guest_password: hashedGuestPassword
        });

        res.json({ message: '隐私设置更新成功' });
    } catch (error) {
        console.error('更新隐私设置失败:', error);
        res.status(500).json({ error: '更新隐私设置失败' });
    }
}

// 验证访客密码
export async function verifyGuestPassword(req: Request, res: Response) {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({ error: '用户ID和密码不能为空' });
        }

        const user = await userModel.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        if (!user.guest_password) {
            return res.status(400).json({ error: '该用户未设置访客模式' });
        }

        const isValid = await bcrypt.compare(password, user.guest_password);
        if (!isValid) {
            return res.status(401).json({ error: '访客密码错误' });
        }

        res.json({ message: '验证成功' });
    } catch (error) {
        console.error('验证访客密码失败:', error);
        res.status(500).json({ error: '验证访客密码失败' });
    }
}

// 获取所有用户 (仅限管理员)
export async function getAllUsers(req: Request, res: Response) {
    try {
        // 检查权限 - 只有管理员可以获取所有用户
        const userRole = req.user?.role;
        if (userRole !== 'admin' && userRole !== 'owner') {
            return res.status(403).json({ error: '权限不足，只有管理员可以获取所有用户列表' });
        }

        const users = await userModel.getAllUsers();

        // 转换用户数据，去除敏感信息
        const safeUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            nickname: user.nickname || user.username,
            avatar: user.avatar,
            currentFamilyId: user.currentFamilyId ? Number(user.currentFamilyId) : null,
            privacy_mode: false, // 默认设为false
            has_guest_password: false, // 默认设为false
            is_frozen: user.role === 'frozen', // 根据角色判断
            // 添加默认的家庭创建和加入限制
            maxFamilies: user.settings?.maxFamilies || 1,
            maxFamilyJoins: user.settings?.maxFamilyJoins || 2,
            created_at: user.created_at,
            updated_at: user.updated_at
        }));

        res.json(safeUsers);
    } catch (error) {
        console.error('获取所有用户失败:', error);
        res.status(500).json({ error: '获取所有用户失败' });
    }
} 