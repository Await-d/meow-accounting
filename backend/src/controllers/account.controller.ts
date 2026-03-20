/*
 * @Author: Await
 * @Date: 2025-03-15 16:28:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 12:56:57
 * @Description: 账户控制器
 */
import { Request, Response, NextFunction } from 'express';
import * as accountModel from '../models/account';
import * as familyModel from '../models/family';

// 创建账户
export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const {
            name,
            type,
            initial_balance,
            currency,
            description,
            family_id,
            user_id
        } = req.body || {};

        if (!name || !type) {
            return res.status(400).json({ error: '账户名称和类型为必填项' });
        }

        const userId = req.user.id;
        let targetUserId: number | undefined = user_id ? parseInt(String(user_id), 10) : undefined;
        let targetFamilyId: number | undefined = family_id ? parseInt(String(family_id), 10) : undefined;

        if (targetUserId && targetUserId !== userId) {
            return res.status(403).json({ error: '无权为其他用户创建账户' });
        }

        if (targetFamilyId) {
            const isAdmin = await familyModel.isFamilyAdmin(targetFamilyId, userId);
            if (!isAdmin) {
                return res.status(403).json({ error: '需要家庭管理员权限' });
            }
            targetUserId = undefined;
        } else {
            targetUserId = userId;
        }

        const account = await accountModel.createAccount({
            name,
            type,
            initial_balance: Number(initial_balance || 0),
            currency: currency || 'CNY',
            description,
            family_id: targetFamilyId,
            user_id: targetUserId,
            created_by: userId
        });

        res.status(201).json(account);
    } catch (error) {
        console.error('创建账户失败:', error);
        next(error);
    }
};

// 获取账户
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: '无效的账户ID' });
        }

        const account = await accountModel.getAccountById(id);
        if (!account) {
            return res.status(404).json({ error: '账户不存在' });
        }

        if (account.family_id) {
            const isMember = await familyModel.isFamilyMember(account.family_id, req.user.id);
            if (!isMember) {
                return res.status(403).json({ error: '无权访问该家庭账户' });
            }
        } else if (account.user_id !== req.user.id) {
            return res.status(403).json({ error: '无权访问该账户' });
        }

        res.json(account);
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
        const userId = req.user.id;

        if (family_id) {
            const familyId = parseInt(String(family_id), 10);
            if (Number.isNaN(familyId)) {
                return res.status(400).json({ error: '无效的家庭ID' });
            }

            const isMember = await familyModel.isFamilyMember(familyId, userId);
            if (!isMember) {
                return res.status(403).json({ error: '无权访问该家庭账户' });
            }

            const accounts = await accountModel.getAccountsByFamilyId(familyId);
            return res.json(accounts);
        }

        if (user_id) {
            const targetUserId = parseInt(String(user_id), 10);
            if (Number.isNaN(targetUserId)) {
                return res.status(400).json({ error: '无效的用户ID' });
            }

            if (targetUserId !== userId) {
                return res.status(403).json({ error: '无权访问其他用户账户' });
            }
        }

        const accounts = await accountModel.getAccountsByUserId(userId);
        res.json(accounts);
    } catch (error) {
        console.error('获取账户列表失败:', error);
        next(error);
    }
};

// 更新账户
export const updateAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: '无效的账户ID' });
        }

        const account = await accountModel.getAccountById(id);
        if (!account) {
            return res.status(404).json({ error: '账户不存在' });
        }

        if (account.family_id) {
            const isAdmin = await familyModel.isFamilyAdmin(account.family_id, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: '需要家庭管理员权限' });
            }
        } else if (account.user_id !== req.user.id) {
            return res.status(403).json({ error: '无权更新该账户' });
        }

        await accountModel.updateAccount(id, {
            name: req.body?.name,
            type: req.body?.type,
            initial_balance: req.body?.initial_balance,
            currency: req.body?.currency,
            description: req.body?.description,
            updated_by: req.user.id
        });

        const updated = await accountModel.getAccountById(id);
        res.json(updated);
    } catch (error) {
        console.error('更新账户失败:', error);
        next(error);
    }
};

// 删除账户
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: '无效的账户ID' });
        }

        const account = await accountModel.getAccountById(id);
        if (!account) {
            return res.status(404).json({ error: '账户不存在' });
        }

        if (account.family_id) {
            const isAdmin = await familyModel.isFamilyAdmin(account.family_id, req.user.id);
            if (!isAdmin) {
                return res.status(403).json({ error: '需要家庭管理员权限' });
            }
        } else if (account.user_id !== req.user.id) {
            return res.status(403).json({ error: '无权删除该账户' });
        }

        const hasTransactions = await accountModel.hasTransactions(id);
        if (hasTransactions) {
            return res.status(400).json({ error: '账户已关联交易记录，无法删除' });
        }

        await accountModel.deleteAccount(id);
        res.json({ message: '账户已删除' });
    } catch (error) {
        console.error('删除账户失败:', error);
        next(error);
    }
};
