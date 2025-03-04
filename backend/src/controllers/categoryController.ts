/*
 * @Author: Await
 * @Date: 2025-03-04 18:47:14
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 18:47:57
 * @Description: 请填写简介
 */
import { Request, Response } from 'express';
import db from '../models/db';
import { Category } from '../types';

export const getAllCategories = (req: Request, res: Response) => {
    const query = 'SELECT * FROM categories ORDER BY type, name';

    db.all(query, (err, categories: Category[]) => {
        if (err) {
            return res.status(500).json({ error: '获取分类列表失败' });
        }
        res.json(categories);
    });
};

export const createCategory = (req: Request, res: Response) => {
    const { name, type, icon } = req.body;

    if (!name || !type) {
        return res.status(400).json({ error: '名称和类型是必填项' });
    }

    const query = 'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)';

    db.run(query, [name, type, icon], function (err) {
        if (err) {
            return res.status(500).json({ error: '创建分类失败' });
        }

        const newCategory: Category = {
            id: this.lastID,
            name,
            type,
            icon
        };

        res.status(201).json(newCategory);
    });
};

export const updateCategory = (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, type, icon } = req.body;

    if (!name || !type) {
        return res.status(400).json({ error: '名称和类型是必填项' });
    }

    const query = 'UPDATE categories SET name = ?, type = ?, icon = ? WHERE id = ?';

    db.run(query, [name, type, icon, id], (err) => {
        if (err) {
            return res.status(500).json({ error: '更新分类失败' });
        }

        res.json({ id: Number(id), name, type, icon });
    });
};

export const deleteCategory = (req: Request, res: Response) => {
    const { id } = req.params;

    // 首先检查是否有交易记录使用了该分类
    db.get('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?', [id], (err, row: any) => {
        if (err) {
            return res.status(500).json({ error: '检查分类使用情况失败' });
        }

        if (row.count > 0) {
            return res.status(400).json({ error: '该分类下有交易记录，无法删除' });
        }

        // 如果没有相关交易记录，则删除分类
        db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({ error: '删除分类失败' });
            }
            res.json({ message: '分类删除成功' });
        });
    });
}; 