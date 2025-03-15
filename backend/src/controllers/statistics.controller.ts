/*
 * @Author: Await
 * @Date: 2025-03-15 15:09:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:09:10
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
        const { startDate, endDate, user_id, family_id } = req.query;

        // 验证必填参数
        if (!startDate || !endDate) {
            return res.status(400).json({ error: '开始日期和结束日期是必需的' });
        }

        // 验证用户权限
        if (family_id && !user_id) {
            // 需要验证用户是否是该家庭的成员
            if (req.user) {
                const isFamilyMember = await transactionModel.isUserInFamily(req.user.id, Number(family_id));
                if (!isFamilyMember) {
                    return res.status(403).json({ error: '您不是该家庭的成员' });
                }
            }
        }

        // 获取统计数据
        const stats = await transactionModel.getTransactionStats({
            startDate: String(startDate),
            endDate: String(endDate),
            userId: user_id ? Number(user_id) : undefined,
            familyId: family_id ? Number(family_id) : undefined
        });

        // 响应统计数据
        res.json({
            total_income: stats.totalIncome,
            total_expense: stats.totalExpense,
            chart: stats.chartData
        });
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
        const { range = 'month', user_id, family_id } = req.query;

        // 计算日期范围
        let startDate: string;
        const endDate = dayjs().format('YYYY-MM-DD');

        // 根据范围确定开始日期
        switch (String(range)) {
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

        // 验证用户权限
        if (family_id && !user_id) {
            // 需要验证用户是否是该家庭的成员
            if (req.user) {
                const isFamilyMember = await transactionModel.isUserInFamily(req.user.id, Number(family_id));
                if (!isFamilyMember) {
                    return res.status(403).json({ error: '您不是该家庭的成员' });
                }
            }
        }

        // 获取分类统计数据
        const categoryStats = await transactionModel.getCategoryStats({
            startDate,
            endDate,
            userId: user_id ? Number(user_id) : undefined,
            familyId: family_id ? Number(family_id) : undefined
        });

        // 响应分类统计数据
        res.json(categoryStats);
    } catch (error) {
        console.error('获取分类统计失败:', error);
        next(error);
    }
}; 