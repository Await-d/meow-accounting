/*
 * @Author: Await
 * @Date: 2025-03-04 19:38:42
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:41:39
 * @Description: 请填写简介
 */
import { Request, Response } from 'express';
import db from '../models/db';

interface TotalRow {
    total: number;
}

interface CategoryRow {
    id: number;
    name: string;
    category_icon: string;
    amount: number;
    count: number;
}

interface TrendRow {
    category_id: number;
    name: string;
    day: string;
    daily_amount: number;
}

interface CategoryTrends {
    [key: number]: number[];
}

export async function getCategoryStats(req: Request, res: Response) {
    try {
        const range = req.query.range as string;
        let startDate: string;
        let endDate = new Date().toISOString().split('T')[0];

        // 根据范围设置开始日期
        switch (range) {
            case 'week':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'quarter':
                startDate = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
                break;
            default:
                startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        }

        // 获取总支出金额
        const totalQuery = `
            SELECT SUM(amount) as total
            FROM transactions
            WHERE type = 'expense'
            AND date BETWEEN ? AND ?
        `;

        // 获取分类统计
        const categoryQuery = `
            SELECT 
                c.id,
                c.name,
                c.icon as category_icon,
                SUM(t.amount) as amount,
                COUNT(*) as count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.type = 'expense'
            AND t.date BETWEEN ? AND ?
            GROUP BY c.id
            ORDER BY amount DESC
        `;

        // 获取每日趋势
        const trendQuery = `
            SELECT 
                c.id as category_id,
                c.name,
                date(t.date) as day,
                SUM(t.amount) as daily_amount
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.type = 'expense'
            AND t.date BETWEEN ? AND ?
            GROUP BY c.id, date(t.date)
            ORDER BY t.date
        `;

        db.get<TotalRow>(totalQuery, [startDate, endDate], (err, totalRow) => {
            if (err) {
                return res.status(500).json({ error: '获取总支出失败' });
            }

            const total = totalRow?.total || 0;

            db.all<CategoryRow>(categoryQuery, [startDate, endDate], (err, categories) => {
                if (err) {
                    return res.status(500).json({ error: '获取分类统计失败' });
                }

                db.all<TrendRow>(trendQuery, [startDate, endDate], (err, trends) => {
                    if (err) {
                        return res.status(500).json({ error: '获取趋势数据失败' });
                    }

                    // 处理趋势数据
                    const categoryTrends: CategoryTrends = {};
                    trends.forEach(trend => {
                        if (!categoryTrends[trend.category_id]) {
                            categoryTrends[trend.category_id] = [];
                        }
                        categoryTrends[trend.category_id].push(trend.daily_amount);
                    });

                    // 组合最终数据
                    const result = categories.map(category => ({
                        name: category.name,
                        category_icon: category.category_icon,
                        amount: category.amount,
                        trend: categoryTrends[category.id] || Array(7).fill(0),
                        percentage: total > 0 ? (category.amount / total * 100) : 0
                    }));

                    res.json(result);
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: '获取分类统计失败' });
    }
} 