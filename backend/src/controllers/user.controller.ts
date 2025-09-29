/*
 * @Author: Await
 * @Date: 2025-03-15 16:10:30
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:09:39
 * @Description: 用户控制器
 */
import { Request, Response, NextFunction } from 'express';
import * as userModel from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSecretKey, passwordConfig } from '../config/auth';

// 获取用户个人资料
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const userId = req.user.id;
        const user = await userModel.getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 剔除敏感信息
        const { password, ...userProfile } = user;

        res.json(userProfile);
    } catch (error) {
        console.error('获取用户个人资料失败:', error);
        next(error);
    }
};

// 更新用户个人资料
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const userId = req.user.id;
        const { username, email, avatar, nickname } = req.body;

        // 验证必要参数
        if (!username && !email && !avatar && !nickname) {
            return res.status(400).json({ error: '至少需要提供一个更新字段' });
        }

        // 检查用户是否存在
        const userExists = await userModel.getUserById(userId);
        if (!userExists) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 如果更新邮箱，检查邮箱是否已被使用
        if (email && email !== userExists.email) {
            const emailExists = await userModel.getUserByEmail(email);
            if (emailExists) {
                return res.status(400).json({ error: '该邮箱已被使用' });
            }
        }

        // 更新用户资料
        const updateResult = await userModel.updateUser(userId, {
            username,
            email,
            avatar,
            nickname
        });

        if (updateResult) {
            // 获取更新后的用户信息
            const updatedUser = await userModel.getUserById(userId);
            if (updatedUser) {
                // 剔除敏感信息
                const { password, ...userProfile } = updatedUser;
                res.json(userProfile);
            } else {
                res.status(404).json({ error: '用户不存在' });
            }
        } else {
            res.status(500).json({ error: '更新失败' });
        }
    } catch (error) {
        console.error('更新用户个人资料失败:', error);
        next(error);
    }
};

// 更新用户密码
export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // 验证必要参数
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: '当前密码和新密码都是必填项' });
        }

        // 检查用户是否存在
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 验证当前密码
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: '当前密码不正确' });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, passwordConfig.saltRounds);

        // 更新密码
        await userModel.updateUser(userId, { password: hashedPassword });

        res.json({ message: '密码更新成功' });
    } catch (error) {
        console.error('更新密码失败:', error);
        next(error);
    }
};

// 更新隐私设置
export const updatePrivacy = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const userId = req.user.id;
        const { privacySettings } = req.body;

        // 验证必要参数
        if (!privacySettings) {
            return res.status(400).json({ error: '隐私设置是必填项' });
        }

        // 检查用户是否存在
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        // 更新隐私设置
        await userModel.updatePrivacySettings(userId, privacySettings);

        res.json({ message: '隐私设置更新成功' });
    } catch (error) {
        console.error('更新隐私设置失败:', error);
        next(error);
    }
};

// 验证访客密码
export const verifyGuest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { familyId, guestPassword } = req.body;

        // 验证必要参数
        if (!familyId || !guestPassword) {
            return res.status(400).json({ error: '家庭ID和访客密码都是必填项' });
        }

        // 验证访客密码
        const isValid = await userModel.verifyGuestPassword(parseInt(familyId), guestPassword);

        if (!isValid) {
            return res.status(401).json({ error: '访客密码不正确' });
        }

        // 生成访客令牌
        const token = jwt.sign(
            {
                role: 'guest',
                familyId: parseInt(familyId)
            },
            getSecretKey(),
            { expiresIn: '24h' }
        );

        res.json({ token, role: 'guest', familyId: parseInt(familyId) });
    } catch (error) {
        console.error('验证访客密码失败:', error);
        next(error);
    }
};

// 获取所有用户（仅管理员）
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 获取所有用户
        const users = await userModel.getAllUsers();

        // 剔除敏感信息
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('获取所有用户失败:', error);
        next(error);
    }
};

// 通过邮箱搜索用户
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: '邮箱是必填项' });
        }

        // 搜索用户
        const users = await userModel.searchUsersByEmail(String(email));

        // 剔除敏感信息
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('搜索用户失败:', error);
        next(error);
    }
};

// 获取用户个人资料（添加别名以匹配路由中使用的名称）
export const getUserProfile = getProfile;

// 更新用户个人资料（添加别名以匹配路由中使用的名称）
export const updateUserProfile = updateProfile;

// 更新用户密码（添加别名以匹配路由中使用的名称）
export const changePassword = updatePassword;

// 隐私设置（添加别名以匹配路由中使用的名称）
export const updatePrivacySettings = updatePrivacy;

// 验证访客密码（添加别名以匹配路由中使用的名称）
export const verifyGuestPassword = verifyGuest;

// 通过邮箱查找用户（添加别名以匹配路由中使用的名称）
export const findUserByEmail = searchUsers; 