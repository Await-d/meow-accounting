/*
 * @Author: Await
 * @Date: 2025-03-05 19:37:11
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:37:32
 * @Description: 请填写简介
 */
import { Request, Response } from 'express';
import * as userModel from '../models/user';

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