import { Request, Response } from 'express';
import db from '../models/db';
import { Transaction } from '../types';

export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // 获取总记录数
        const result = await db.findOne<{ total: number }>('SELECT COUNT(*) as total FROM transactions');
        const total = result?.total || 0;

        // 获取分页数据
        const query = `
            SELECT t.*, c.name as category_name, c.icon as category_icon 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY t.date DESC
            LIMIT ? OFFSET ?
        `;

        const transactions = await db.findMany(query, [limit, offset]);

        res.json({
            data: transactions,
            total,
            hasMore: offset + transactions.length < total
        });
    } catch (err) {
        res.status(500).json({ error: '获取交易记录失败' });
    }
};

export const getTransactionsByDateRange = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: '开始日期和结束日期是必填项' });
        }

        const query = `
            SELECT t.*, c.name as category_name, c.icon as category_icon 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.date BETWEEN ? AND ?
            ORDER BY t.date DESC
        `;

        const transactions = await db.findMany(query, [startDate, endDate]);
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: '获取交易记录失败' });
    }
};

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { amount, type, category_id, description, date } = req.body;

        if (!amount || !type || !category_id || !date) {
            return res.status(400).json({ error: '金额、类型、分类和日期是必填项' });
        }

        const query = `
            INSERT INTO transactions (amount, type, category_id, description, date)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await db.insert(query, [amount, type, category_id, description, date]);

        const newTransaction: Transaction = {
            id: result,
            amount,
            type,
            category_id,
            description,
            date
        };

        res.status(201).json(newTransaction);
    } catch (err) {
        res.status(500).json({ error: '创建交易记录失败' });
    }
};

export const updateTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, type, category_id, description, date } = req.body;

        if (!amount || !type || !category_id || !date) {
            return res.status(400).json({ error: '金额、类型、分类和日期是必填项' });
        }

        const query = `
            UPDATE transactions 
            SET amount = ?, type = ?, category_id = ?, description = ?, date = ?
            WHERE id = ?
        `;

        await db.execute(query, [amount, type, category_id, description, date, id]);

        res.json({
            id: Number(id),
            amount,
            type,
            category_id,
            description,
            date
        });
    } catch (err) {
        res.status(500).json({ error: '更新交易记录失败' });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
        res.json({ message: '交易记录删除成功' });
    } catch (err) {
        res.status(500).json({ error: '删除交易记录失败' });
    }
};

export const getStatistics = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: '开始日期和结束日期是必填项' });
        }

        const query = `
            SELECT 
                t.type,
                c.name as category_name,
                c.icon as category_icon,
                SUM(t.amount) as total_amount,
                COUNT(*) as transaction_count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.date BETWEEN ? AND ?
            GROUP BY t.type, t.category_id
            ORDER BY t.type, total_amount DESC
        `;

        const statistics = await db.findMany(query, [startDate, endDate]);

        // 计算总收入和支出
        const totals = statistics.reduce((acc: any, curr: any) => {
            if (curr.type === 'income') {
                acc.totalIncome += curr.total_amount;
            } else {
                acc.totalExpense += curr.total_amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        res.json({
            details: statistics,
            summary: totals
        });
    } catch (err) {
        res.status(500).json({ error: '获取统计数据失败' });
    }
}; 