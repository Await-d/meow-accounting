import { Request, Response } from 'express';
import { createUser, findUserByEmail, verifyPassword } from '../models/user';
import { generateToken } from '../middleware/auth';
import { validateEmail, validatePassword } from '../utils/validation';

export async function register(req: Request, res: Response) {
    try {
        const { username, email, password } = req.body;

        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({ error: '请填写所有必填字段' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: '邮箱格式不正确' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: '密码必须至少包含8个字符' });
        }

        // 检查邮箱是否已存在
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: '该邮箱已被注册' });
        }

        // 创建新用户
        const userId = await createUser(username, email, password);
        const token = generateToken(userId);

        res.status(201).json({
            user: {
                id: userId,
                username,
                email
            },
            token
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
}

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({ error: '请填写邮箱和密码' });
        }

        // 查找用户
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 验证密码
        const isValid = await verifyPassword(user, password);
        if (!isValid) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 生成token
        const token = generateToken(user.id);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
} 