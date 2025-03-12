import { Request, Response } from 'express';
import * as transactionModel from '../models/transaction';
import * as categoryModel from '../models/category';
import { validateTransaction } from '../utils/validation';

interface Transaction {
    id: number;
    amount: number;
    category_id: number;
    description: string;
    date: string;
    type: string;
    user_id: number;
    family_id: number;
}

// 创建事务
export async function createTransaction(req: Request, res: Response) {
    try {
        const { amount, category_id, description, date, type, family_id } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 验证输入
        const validationError = validateTransaction(amount, category_id, description, date, type);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // 验证分类是否属于该家庭
        const belongs = await categoryModel.isCategoryInFamily(category_id, family_id);
        if (!belongs) {
            return res.status(400).json({ error: '分类不属于该家庭' });
        }

        const transaction = await transactionModel.createTransaction({
            amount,
            category_id,
            description,
            date,
            type,
            user_id: userId,
            family_id
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('创建事务失败:', error);
        res.status(500).json({ error: '创建事务失败' });
    }
}

// 获取事务列表
export async function getTransactions(req: Request, res: Response) {
    try {
        const { family_id, startDate, endDate, type, category_id, page = 1, pageSize = 20 } = req.query;

        if (!family_id) {
            return res.status(400).json({ error: '缺少家庭ID' });
        }

        const transactions = await transactionModel.getTransactions({
            family_id: parseInt(family_id as string),
            startDate: startDate as string,
            endDate: endDate as string,
            type: type as 'income' | 'expense',
            category_id: category_id ? parseInt(category_id as string) : undefined,
            page: parseInt(page as string),
            pageSize: parseInt(pageSize as string)
        });

        res.json(transactions);
    } catch (error) {
        console.error('获取事务列表失败:', error);
        res.status(500).json({ error: '获取事务列表失败' });
    }
}

// 获取事务详情
export async function getTransactionById(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const transaction = await transactionModel.getTransactionById(parseInt(id));
        if (!transaction) {
            return res.status(404).json({ error: '事务不存在' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('获取事务详情失败:', error);
        res.status(500).json({ error: '获取事务详情失败' });
    }
}

// 更新事务
export async function updateTransaction(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { amount, category_id, description, date, type } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const transaction = await transactionModel.getTransactionById(parseInt(id)) as Transaction;
        if (!transaction) {
            return res.status(404).json({ error: '事务不存在' });
        }

        // 只允许创建者更新事务
        if (transaction.user_id !== userId) {
            return res.status(403).json({ error: '无权更新此事务' });
        }

        // 验证输入
        if (amount || category_id || date || type) {
            const validationError = validateTransaction(
                amount || transaction.amount,
                category_id || transaction.category_id,
                description || transaction.description,
                date || transaction.date,
                type || transaction.type
            );
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }
        }

        // 如果更新了分类，验证新分类是否属于该家庭
        if (category_id && category_id !== transaction.category_id) {
            const belongs = await categoryModel.isCategoryInFamily(category_id, transaction.family_id);
            if (!belongs) {
                return res.status(400).json({ error: '分类不属于该家庭' });
            }
        }

        const updatedTransaction = await transactionModel.updateTransaction(parseInt(id), {
            amount,
            category_id,
            description,
            date,
            type
        });

        if (!updatedTransaction) {
            return res.status(400).json({ error: '无更新内容' });
        }

        res.json(updatedTransaction);
    } catch (error) {
        console.error('更新事务失败:', error);
        res.status(500).json({ error: '更新事务失败' });
    }
}

// 删除事务
export async function deleteTransaction(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const transaction = await transactionModel.getTransactionById(parseInt(id)) as Transaction;
        if (!transaction) {
            return res.status(404).json({ error: '事务不存在' });
        }

        // 只允许创建者删除事务
        if (transaction.user_id !== userId) {
            return res.status(403).json({ error: '无权删除此事务' });
        }

        await transactionModel.deleteTransaction(parseInt(id));
        res.json({ message: '事务删除成功' });
    } catch (error) {
        console.error('删除事务失败:', error);
        res.status(500).json({ error: '删除事务失败' });
    }
}

// 获取分类统计
export async function getCategoryStats(req: Request, res: Response) {
    try {
        const { family_id, startDate, endDate, type } = req.query;

        if (!family_id) {
            return res.status(400).json({ error: '缺少家庭ID' });
        }

        const stats = await transactionModel.getCategoryStats({
            family_id: parseInt(family_id as string),
            startDate: startDate as string,
            endDate: endDate as string,
            type: type as 'income' | 'expense'
        });

        res.json(stats);
    } catch (error) {
        console.error('获取分类统计失败:', error);
        res.status(500).json({ error: '获取分类统计失败' });
    }
}

// 获取总体统计
export async function getStatistics(req: Request, res: Response) {
    try {
        const { startDate, endDate } = req.query;

        if (!req.user || !(req.user as any).currentFamilyId) {
            return res.status(400).json({ error: '未选择家庭或无权限' });
        }

        const familyId = (req.user as any).currentFamilyId;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: '缺少必要的日期参数' });
        }

        const stats = await transactionModel.getStatistics({
            familyId,
            startDate: startDate as string,
            endDate: endDate as string
        });

        res.json(stats);
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '获取统计数据失败' });
    }
}
