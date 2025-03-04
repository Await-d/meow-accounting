import { Request, Response } from 'express';
import db from '../models/db';
import { Transaction } from '../types';

export const getAllTransactions = (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 获取总记录数
    db.get('SELECT COUNT(*) as total FROM transactions', [], (err, result: any) => {
        if (err) {
            return res.status(500).json({ error: '获取交易记录失败' });
        }

        const total = result.total;

        // 获取分页数据
        const query = `
            SELECT t.*, c.name as category_name, c.icon as category_icon 
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            ORDER BY t.date DESC
            LIMIT ? OFFSET ?
        `;

        db.all(query, [limit, offset], (err, transactions) => {
            if (err) {
                return res.status(500).json({ error: '获取交易记录失败' });
            }

            res.json({
                data: transactions,
                total,
                hasMore: offset + transactions.length < total
            });
        });
    });
};

export const getTransactionsByDateRange = (req: Request, res: Response) => {
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

    db.all(query, [startDate, endDate], (err, transactions) => {
        if (err) {
            return res.status(500).json({ error: '获取交易记录失败' });
        }
        res.json(transactions);
    });
};

export const createTransaction = (req: Request, res: Response) => {
    const { amount, type, category_id, description, date } = req.body;

    if (!amount || !type || !category_id || !date) {
        return res.status(400).json({ error: '金额、类型、分类和日期是必填项' });
    }

    const query = `
    INSERT INTO transactions (amount, type, category_id, description, date)
    VALUES (?, ?, ?, ?, ?)
  `;

    db.run(query, [amount, type, category_id, description, date], function (err) {
        if (err) {
            return res.status(500).json({ error: '创建交易记录失败' });
        }

        const newTransaction: Transaction = {
            id: this.lastID,
            amount,
            type,
            category_id,
            description,
            date
        };

        res.status(201).json(newTransaction);
    });
};

export const updateTransaction = (req: Request, res: Response) => {
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

    db.run(query, [amount, type, category_id, description, date, id], (err) => {
        if (err) {
            return res.status(500).json({ error: '更新交易记录失败' });
        }

        res.json({
            id: Number(id),
            amount,
            type,
            category_id,
            description,
            date
        });
    });
};

export const deleteTransaction = (req: Request, res: Response) => {
    const { id } = req.params;

    db.run('DELETE FROM transactions WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({ error: '删除交易记录失败' });
        }
        res.json({ message: '交易记录删除成功' });
    });
};

export const getStatistics = (req: Request, res: Response) => {
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

    db.all(query, [startDate, endDate], (err, statistics) => {
        if (err) {
            return res.status(500).json({ error: '获取统计数据失败' });
        }

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
    });
}; 