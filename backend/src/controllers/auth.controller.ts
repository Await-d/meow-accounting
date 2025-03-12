/*
 * @Author: Await
 * @Date: 2025-03-05 19:23:46
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 20:31:35
 * @Description: 请填写简介
 */
import {Request, Response} from 'express';
import {createUser, findUserByEmail, findUserById, verifyPassword} from '../models/user';
import {generateToken} from '../middleware/auth';
import {validateEmail, validatePassword} from '../utils/validation';

export async function register(req: Request, res: Response) {
    try {
        const {username, email, password} = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({error: '请填写所有必填字段'});
        }

        if (!validateEmail(email)) {
            return res.status(400).json({error: '邮箱格式不正确'});
        }

        if (!validatePassword(password)) {
            return res.status(400).json({error: '密码必须至少包含8个字符'});
        }

        // 检查邮箱是否已存在
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({error: '该邮箱已被注册'});
        }

        // 创建新用户
        const userId = await createUser(username, email, password);
        const user = await findUserById(userId);
        if (!user) {
            throw new Error('创建用户失败');
        }

        // 获取用户权限
        const permissions = getUserPermissions(user.role);

        // 返回用户信息和权限
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role,
            currentFamilyId: user.currentFamilyId ? Number(user.currentFamilyId) : undefined,
            settings: user.settings,
            permissions
        };

        // 生成token
        const token = generateToken(userData);

        res.status(201).json({
            token,
            user: userData
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({error: '注册失败，请稍后重试'});
    }
}

// 根据用户角色获取权限列表
const getUserPermissions = (role: string): string[] => {
    const basePermissions = [
        'profile.view',
        'security.view',
        'privacy.view'
    ];

    const memberPermissions = [
        ...basePermissions,
        'category.view',
        'family.view'
    ];

    const adminPermissions = [
        ...memberPermissions,
        'category.manage',
        'family.manage',
        'invitations.manage',
        'routes.manage'
    ];

    const ownerPermissions = [
        ...adminPermissions,
        'cache.manage',
        'settings.customize'
    ];

    switch (role) {
        case 'owner':
            return ownerPermissions;
        case 'admin':
            return adminPermissions;
        case 'member':
            return memberPermissions;
        default:
            return basePermissions;
    }
};

// 登录处理
export async function login(req: Request, res: Response) {
    try {
        const {email, password} = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({error: '请填写邮箱和密码'});
        }

        // 查找用户
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({error: '邮箱或密码错误'});
        }

        // 验证密码
        const isValid = await verifyPassword(user, password);
        if (!isValid) {
            return res.status(401).json({error: '邮箱或密码错误'});
        }

        // 获取用户权限
        const permissions = getUserPermissions(user.role);

        // 返回用户信息和权限
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role,
            currentFamilyId: user.currentFamilyId,
            settings: user.settings,
            permissions
        };

        // 生成token
        const token = generateToken(userData);

        res.json({
            token,
            user: userData
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({error: '登录失败，请稍后重试'});
    }
}
