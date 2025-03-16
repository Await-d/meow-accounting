/*
 * @Author: Await
 * @Date: 2025-03-15 15:09:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 13:15:38
 * @Description: 统计数据控制器
 */
import { Request, Response, NextFunction } from 'express';
import * as transactionModel from '../models/transaction';
import dayjs from 'dayjs';

/**
 * 获取交易统计数据
 */
export const getTransactionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 解析查询参数
        const { range = 'month', user_id, family_id, familyId } = req.query;
        const actualFamilyId = family_id || familyId;

        // 获取当前登录用户ID
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ error: '未授权访问' });
        }

        // 计算日期范围
        const { startDate, endDate } = calculateDateRange(String(range));

        // 构建查询参数
        const params: transactionModel.TransactionStatsParams = {
            startDate,
            endDate
        };

        // 设置用户ID或家庭ID
        if (actualFamilyId) {
            params.familyId = parseInt(String(actualFamilyId));
            // 家庭ID的权限检查由familyMemberMiddleware处理
        } else if (user_id) {
            const requestedUserId = parseInt(String(user_id));
            // 验证请求的user_id与当前登录用户是否匹配
            if (requestedUserId !== currentUserId) {
                return res.status(403).json({ error: '无权访问其他用户的数据' });
            }
            params.userId = requestedUserId;
        } else if (req.user) {
            // 如果没有指定user_id或family_id，默认使用当前用户ID
            params.userId = req.user.id;
        }

        // 获取统计数据
        const stats = await transactionModel.getTransactionStats(params);

        res.json(stats);
    } catch (error) {
        console.error('获取交易统计失败:', error);
        next(error);
    }
};

/**
 * 获取分类统计数据
 */
export const getCategoryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 解析查询参数
        const { range = 'month', user_id, family_id, familyId } = req.query;
        const actualFamilyId = family_id || familyId;

        // 获取当前登录用户ID
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ error: '未授权访问' });
        }

        // 计算日期范围
        const { startDate, endDate } = calculateDateRange(String(range));

        // 构建查询参数
        const params: transactionModel.CategoryStatsParams = {
            startDate,
            endDate
        };

        // 设置用户ID或家庭ID
        if (actualFamilyId) {
            params.familyId = parseInt(String(actualFamilyId));
            // 家庭ID的权限检查由familyMemberMiddleware处理
        } else if (user_id) {
            const requestedUserId = parseInt(String(user_id));
            // 验证请求的user_id与当前登录用户是否匹配
            if (requestedUserId !== currentUserId) {
                return res.status(403).json({ error: '无权访问其他用户的数据' });
            }
            params.userId = requestedUserId;
        } else if (req.user) {
            // 如果没有指定user_id或family_id，默认使用当前用户ID
            params.userId = req.user.id;
        }

        // 获取分类统计数据
        const categoryStats = await transactionModel.getTransactionCategoryStats(params);

        res.json(categoryStats);
    } catch (error) {
        console.error('获取分类统计失败:', error);
        next(error);
    }
};

function calculateDateRange(range: string) {
    let startDate: string;
    const endDate = dayjs().format('YYYY-MM-DD');

    switch (range) {
        case 'week':
            startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
            break;
        case 'quarter':
            const quarterStart = Math.floor(dayjs().month() / 3) * 3;
            startDate = dayjs().month(quarterStart).startOf('month').format('YYYY-MM-DD');
            break;
        case 'year':
            startDate = dayjs().startOf('year').format('YYYY-MM-DD');
            break;
        case 'month':
        default:
            startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
} 