import { Request, Response, NextFunction } from 'express';
import * as transactionModel from '../models/transaction';
import * as categoryModel from '../models/category';
import { validateTransaction } from '../utils/validation';
import dayjs from 'dayjs';
import { RequestHandler } from 'express-serve-static-core';

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

// 扩展Request类型以包含file属性
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

// 创建事务
export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 支持两种参数名: family_id 和 familyId
        const { amount, type, category_id, description, date, family_id, familyId } = req.body;
        const actualFamilyId = family_id || familyId;

        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const userId = req.user.id;

        // 验证必要参数
        if (!amount || !type || !category_id || !date) {
            return res.status(400).json({ error: '金额、类型、分类和日期都是必填项' });
        }

        // 如果指定了家庭，验证用户是否属于该家庭
        if (actualFamilyId) {
            const isUserInFamily = await transactionModel.isUserInFamily(userId, parseInt(actualFamilyId));
            if (!isUserInFamily) {
                return res.status(403).json({ error: '您不属于该家庭，无法创建家庭交易' });
            }

            // 验证分类是否属于该家庭
            const belongs = await categoryModel.isCategoryInFamily(parseInt(category_id), parseInt(actualFamilyId));
            if (!belongs) {
                return res.status(400).json({ error: '分类不属于该家庭' });
            }
        }

        // 创建交易记录
        const transaction = await transactionModel.createTransaction({
            amount: parseFloat(amount),
            type,
            category_id: parseInt(category_id),
            description: description || '',
            date,
            user_id: userId,
            family_id: actualFamilyId ? parseInt(actualFamilyId) : undefined
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('创建事务失败:', error);
        next(error);
    }
};

// 获取事务列表
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, type, user_id, family_id, familyId } = req.query;
        const actualFamilyId = family_id || familyId;

        // 获取当前登录用户ID
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ error: '未授权访问' });
        }

        // 构建查询参数
        const queryParams: any = {};

        if (startDate && endDate) {
            queryParams.startDate = String(startDate);
            queryParams.endDate = String(endDate);
        }

        if (type) {
            queryParams.type = String(type);
        }

        // 确保只能查询自己的数据
        if (user_id) {
            const requestedUserId = parseInt(String(user_id));
            // 二次检查，确保user_id与当前登录用户一致（防止中间件被绕过）
            if (requestedUserId !== currentUserId) {
                return res.status(403).json({ error: '无权访问其他用户的数据' });
            }
            queryParams.user_id = requestedUserId;
        }

        if (actualFamilyId) {
            queryParams.family_id = parseInt(String(actualFamilyId));
            // 家庭ID的权限检查由familyMemberMiddleware处理
        }

        // 记录请求参数以便调试
        console.log("[GET transactions] 查询参数:", JSON.stringify(queryParams));

        // 获取事务记录
        const transactions = await transactionModel.getTransactions(queryParams);

        // 直接返回data数组，确保前端接收一致的格式
        console.log("[GET transactions] 返回数据长度:", transactions.data?.length || 0);

        // 直接返回data数组而不是整个分页对象
        res.json(transactions.data || []);
    } catch (error) {
        console.error('获取事务列表失败:', error);
        next(error);
    }
};

// 获取事务详情
export const getTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的事务ID' });
        }

        const transaction = await transactionModel.getTransactionById(id);

        if (!transaction) {
            return res.status(404).json({ error: '事务记录不存在' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('获取事务详情失败:', error);
        next(error);
    }
};

// 获取事务详情（别名，保持兼容性）
export const getTransactionById = getTransaction;

// 更新事务
export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        const { amount, type, category_id, description, date } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的事务ID' });
        }

        // 验证事务记录是否存在
        const existingTransaction = await transactionModel.getTransactionById(id);

        if (!existingTransaction) {
            return res.status(404).json({ error: '事务记录不存在' });
        }

        // 更新事务记录
        const updatedTransaction = await transactionModel.updateTransaction(id, {
            amount: parseFloat(amount),
            type,
            category_id: parseInt(category_id),
            description: description || '',
            date
        });

        res.json(updatedTransaction);
    } catch (error) {
        console.error('更新事务失败:', error);
        next(error);
    }
};

// 删除事务
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的事务ID' });
        }

        // 验证事务记录是否存在
        const existingTransaction = await transactionModel.getTransactionById(id);

        if (!existingTransaction) {
            return res.status(404).json({ error: '事务记录不存在' });
        }

        // 删除事务记录
        await transactionModel.deleteTransaction(id);

        res.json({ message: '事务记录已删除' });
    } catch (error) {
        console.error('删除事务失败:', error);
        next(error);
    }
};

// 获取分类统计
export const getCategoryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { range, user_id, family_id } = req.query;

        // 直接导入并调用统计控制器
        const statisticsController = require('../controllers/statistics.controller');
        await statisticsController.getCategoryStats(req, res, next);
    } catch (error) {
        console.error('获取分类统计失败:', error);
        next(error);
    }
};

// 获取总体统计
export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 直接导入并调用统计控制器
        const statisticsController = require('../controllers/statistics.controller');
        await statisticsController.getTransactionStats(req, res, next);
    } catch (error) {
        console.error('获取统计数据失败:', error);
        next(error);
    }
};

// 获取最近的交易记录
export const getRecentTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit = 5, user_id, family_id, familyId } = req.query;
        const actualFamilyId = family_id || familyId;

        // 获取当前登录用户ID
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ error: '未授权访问' });
        }

        // 构建查询参数
        const queryParams: any = {
            limit: parseInt(String(limit))
        };

        // 确保只能查询自己的数据
        if (user_id) {
            const requestedUserId = parseInt(String(user_id));
            // 验证请求的user_id与当前登录用户是否匹配
            if (requestedUserId !== currentUserId) {
                return res.status(403).json({ error: '无权访问其他用户的数据' });
            }
            queryParams.userId = requestedUserId;
        }

        if (actualFamilyId) {
            queryParams.familyId = parseInt(String(actualFamilyId));
            // 家庭ID权限检查由familyMemberMiddleware处理
        }

        // 获取最近交易记录
        const transactions = await transactionModel.getRecentTransactions(queryParams);

        res.json(transactions);
    } catch (error) {
        console.error('获取最近交易记录失败:', error);
        next(error);
    }
};

// 导入事务记录
export const importTransactions = async (req: MulterRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '未提供CSV文件' });
        }

        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        // TODO: 实现CSV文件解析和导入
        // 这里需要根据实际业务需求完成CSV文件解析和批量导入功能

        res.json({ message: '导入成功', count: 0 });
    } catch (error) {
        console.error('导入事务记录失败:', error);
        next(error);
    }
};

// 导出事务记录
export const exportTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, family_id } = req.query;

        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        // 验证必要参数
        if (!family_id) {
            return res.status(400).json({ error: '家庭ID是必填项' });
        }

        // 构建查询参数
        const queryParams: any = {
            family_id: parseInt(String(family_id))
        };

        if (startDate && endDate) {
            queryParams.startDate = String(startDate);
            queryParams.endDate = String(endDate);
        }

        // 获取事务记录
        const transactions = await transactionModel.getTransactions(queryParams);

        // 生成CSV数据
        const headers = ['ID', '金额', '类型', '分类', '描述', '日期', '创建者'];
        const csvData = [
            headers.join(','),
            ...(transactions.data || []).map((t: any) => {
                return [
                    t.id,
                    t.amount,
                    t.type,
                    t.category_name || t.category_id,
                    `"${t.description.replace(/"/g, '""')}"`,
                    t.date,
                    t.user_name || t.user_id
                ].join(',');
            })
        ].join('\n');

        // 设置响应头
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${dayjs().format('YYYY-MM-DD')}.csv`);

        // 发送CSV数据
        res.send(csvData);
    } catch (error) {
        console.error('导出事务记录失败:', error);
        next(error);
    }
};

// 以下方法用于兼容性，因为主路由中使用了这些方法名称
export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        // 使用现有的getTransactions方法
        const queryParams: any = {
            page,
            pageSize: limit
        };

        if (req.query.family_id) {
            queryParams.family_id = parseInt(String(req.query.family_id));
        }

        const transactions = await transactionModel.getTransactions(queryParams);

        res.json(transactions);
    } catch (error) {
        console.error('获取所有交易记录失败:', error);
        next(error);
    }
};

export const getTransactionsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, family_id } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: '开始日期和结束日期是必填项' });
        }

        if (!family_id) {
            return res.status(400).json({ error: '家庭ID是必填项' });
        }

        const queryParams: any = {
            family_id: parseInt(String(family_id)),
            startDate: String(startDate),
            endDate: String(endDate)
        };

        const transactions = await transactionModel.getTransactions(queryParams);

        res.json(transactions);
    } catch (error) {
        console.error('按日期范围获取交易记录失败:', error);
        next(error);
    }
};
