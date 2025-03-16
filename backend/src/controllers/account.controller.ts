/*
 * @Author: Await
 * @Date: 2025-03-15 16:28:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 12:56:57
 * @Description: 账户控制器
 */
import { Request, Response, NextFunction } from 'express';
import * as accountModel from '../models/account';

// 创建账户
export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({ message: '账户功能已简化，不支持创建额外账户' });
};

// 获取账户
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const id = parseInt(req.params.id);

        // 如果请求的ID与当前用户ID匹配，返回默认账户
        if (id === req.user.id) {
            const defaultAccount = {
                id: req.user.id,
                name: `${req.user.username || '用户'}的账户`,
                type: 'default',
                balance: 0,
                currency: 'CNY',
                user_id: req.user.id,
                username: req.user.username,
                created_at: new Date().toISOString()
            };

            return res.json(defaultAccount);
        }

        return res.status(404).json({ error: '账户不存在' });
    } catch (error) {
        console.error('获取账户失败:', error);
        next(error);
    }
};

// 获取账户列表
export const getAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const { family_id, user_id } = req.query;

        // 直接使用当前登录用户作为默认账户返回
        // 创建一个虚拟账户对象，使用用户信息
        const defaultAccount = {
            id: req.user.id,
            name: `${req.user.username || '用户'}的账户`,
            type: 'default',
            balance: 0,
            currency: 'CNY',
            user_id: req.user.id,
            username: req.user.username,
            created_at: new Date().toISOString()
        };

        return res.json([defaultAccount]);
    } catch (error) {
        console.error('获取账户列表失败:', error);
        next(error);
    }
};

// 更新账户
export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({ message: '账户功能已简化，不支持更新账户' });
};

// 删除账户
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    res.status(501).json({ message: '账户功能已简化，不支持删除账户' });
}; 