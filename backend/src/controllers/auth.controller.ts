/*
 * @Author: Await
 * @Date: 2025-03-15 15:15:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 21:02:10
 * @Description: 认证控制器
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as userModel from '../models/user';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import { getSecretKey, jwtConfig } from '../config/auth';

// 注册新用户
export async function register(req: Request, res: Response) {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!validateUsername(username)) {
            return res.status(400).json({ error: '用户名格式不正确' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: '密码不符合要求' });
        }

        // 检查邮箱是否已被使用
        const existingUser = await userModel.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: '该邮箱已被注册' });
        }

        // 检查是否是第一个用户（系统中还没有用户）
        const isFirstUser = !(await userModel.hasAnyUser());

        // 创建新用户
        const hashedPassword = await bcrypt.hash(password, 10);
        const userData = {
            username,
            email,
            password: hashedPassword,
            role: isFirstUser ? 'admin' : 'user' // 第一个用户默认为管理员
        };

        const userId = await userModel.createUser(userData);

        // 获取新创建的用户信息
        const newUser = await userModel.getUserById(userId);

        if (!newUser) {
            return res.status(500).json({ error: '用户创建失败' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
            getSecretKey(),
            { expiresIn: '24h' }
        );

        // 添加一条日志，显示用户角色
        console.log(`用户注册成功 - 用户名: ${newUser.username}, 角色: ${newUser.role}${isFirstUser ? ' (第一个用户，自动设为管理员)' : ''}`);

        res.status(201).json({
            message: '注册成功',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败' });
    }
}

// 用户登录
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: '邮箱和密码不能为空' });
        }

        // 查找用户
        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: '用户不存在或密码错误' });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: '用户不存在或密码错误' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            getSecretKey(),
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
}

// 获取当前用户信息
export async function getCurrentUser(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未登录' });
        }

        res.json({ user: req.user });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ error: '获取用户信息失败' });
    }
}

// 刷新令牌
export async function refreshToken(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未登录' });
        }

        // 生成新的JWT令牌
        const token = jwt.sign(
            {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role
            },
            getSecretKey(),
            { expiresIn: '24h' }
        );

        res.json({ message: '令牌刷新成功', token });
    } catch (error) {
        console.error('刷新令牌失败:', error);
        res.status(500).json({ error: '刷新令牌失败' });
    }
}
