/*
 * @Author: Await
 * @Date: 2025-03-15 16:28:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 16:28:10
 * @Description: 账户控制器
 */
import { Request, Response, NextFunction } from 'express';
import * as accountModel from '../models/account';

// 创建账户
export const createAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const { name, type, initial_balance, currency, description, family_id, is_personal } = req.body;

        // 验证必要参数
        if (!name || !type) {
            return res.status(400).json({ error: '账户名称和类型是必填项' });
        }

        // 检查是个人账户还是家庭账户
        if (is_personal) {
            // 创建个人账户
            const account = await accountModel.createAccount({
                name,
                type,
                initial_balance: parseFloat(initial_balance || 0),
                currency: currency || 'CNY',
                description: description || '',
                user_id: req.user.id,  // 使用当前用户ID
                created_by: req.user.id
            });

            res.status(201).json(account);
        } else {
            // 必须提供family_id
            if (!family_id) {
                return res.status(400).json({ error: '家庭账户必须提供family_id' });
            }

            // 验证用户是否属于该家庭
            const isMember = await accountModel.isUserInFamily(req.user.id, parseInt(family_id));
            if (!isMember) {
                return res.status(403).json({ error: '无权在此家庭中创建账户' });
            }

            // 创建家庭账户
            const account = await accountModel.createAccount({
                name,
                type,
                initial_balance: parseFloat(initial_balance || 0),
                currency: currency || 'CNY',
                description: description || '',
                family_id: parseInt(family_id),
                created_by: req.user.id
            });

            res.status(201).json(account);
        }
    } catch (error) {
        console.error('创建账户失败:', error);
        next(error);
    }
};

// 获取账户
export const getAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的账户ID' });
        }

        const account = await accountModel.getAccountById(id);

        if (!account) {
            return res.status(404).json({ error: '账户不存在' });
        }

        // 验证用户是否有权限访问该账户
        if (req.user) {
            // 个人账户 - 只有自己能访问
            if (account.user_id) {
                if (account.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
                    return res.status(403).json({ error: '无权访问该账户' });
                }
            }
            // 家庭账户 - 家庭成员能访问
            else if (account.family_id) {
                const isMember = await accountModel.isUserInFamily(req.user.id, account.family_id);
                if (!isMember) {
                    return res.status(403).json({ error: '无权访问该账户' });
                }
            }
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

        // 如果提供了family_id，通过家庭ID获取账户
        if (family_id) {
            // 验证用户是否有权限访问该家庭的账户
            const isMember = await accountModel.isUserInFamily(req.user.id, parseInt(String(family_id)));
            if (!isMember) {
                return res.status(403).json({ error: '无权访问该家庭的账户' });
            }

            // 获取账户列表
            const accounts = await accountModel.getAccountsByFamilyId(parseInt(String(family_id)));
            return res.json(accounts);
        }

        // 如果提供了user_id，通过用户ID获取账户
        else if (user_id) {
            // 验证是否是查询自己的账户，或者管理员查询他人账户
            if (parseInt(String(user_id)) !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
                return res.status(403).json({ error: '无权访问其他用户的账户' });
            }

            // 获取用户账户列表
            const accounts = await accountModel.getAccountsByUserId(parseInt(String(user_id)));

            // 即使没有账户也返回空数组，而不是404错误
            return res.json(accounts);
        }

        // 如果既没有family_id也没有user_id，返回404
        else {
            return res.status(404).json({ error: '未找到账户' });
        }
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

        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的账户ID' });
        }

        // 获取账户信息
        const account = await accountModel.getAccountById(id);

        if (!account) {
            return res.status(404).json({ error: '账户不存在' });
        }

        // 验证用户是否有权限更新该账户
        // 对于个人账户，只有账户所有者和管理员可以更新
        if (account.user_id) {
            if (account.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
                return res.status(403).json({ error: '无权更新该账户' });
            }
        }
        // 对于家庭账户，需要是家庭成员
        else if (account.family_id) {
            const isMember = await accountModel.isUserInFamily(req.user.id, account.family_id);
            if (!isMember) {
                return res.status(403).json({ error: '无权更新该账户' });
            }
        }

        const { name, type, initial_balance, currency, description } = req.body;

        // 更新账户
        await accountModel.updateAccount(id, {
            name,
            type,
            initial_balance: parseFloat(initial_balance),
            currency,
            description,
            updated_by: req.user.id
        });

        // 获取更新后的账户信息
        const updatedAccount = await accountModel.getAccountById(id);
        res.json(updatedAccount);
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

        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的账户ID' });
        }

        // 获取账户信息
        const account = await accountModel.getAccountById(id);

        if (!account) {
            return res.status(404).json({ error: '账户不存在' });
        }

        // 验证用户是否有权限删除该账户
        // 对于个人账户，只有账户所有者和管理员可以删除
        if (account.user_id) {
            if (account.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
                return res.status(403).json({ error: '无权删除该账户' });
            }
        }
        // 对于家庭账户，需要是家庭成员
        else if (account.family_id) {
            const isMember = await accountModel.isUserInFamily(req.user.id, account.family_id);
            if (!isMember) {
                return res.status(403).json({ error: '无权删除该账户' });
            }
        }

        // 验证该账户是否有关联的交易记录
        const hasTransactions = await accountModel.hasTransactions(id);
        if (hasTransactions) {
            return res.status(400).json({ error: '该账户存在交易记录，无法删除' });
        }

        // 删除账户
        await accountModel.deleteAccount(id);

        res.json({ message: '账户删除成功' });
    } catch (error) {
        console.error('删除账户失败:', error);
        next(error);
    }
}; 