/*
 * @Author: Await
 * @Date: 2025-03-05 21:21:50
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 09:51:14
 * @Description: 请填写简介
 */
import { Request, Response } from 'express';
import * as categoryModel from '../models/category';

// 创建分类
export async function createCategory(req: Request, res: Response) {
    try {
        const { name, icon, type, family_id } = req.body;

        if (!name || !type || !family_id) {
            return res.status(400).json({ error: '缺少必要参数' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: '类型必须是收入或支出' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        // 自定义分类必须关联到家庭
        const category = await categoryModel.createCategory({
            name,
            icon: icon || '',
            color: req.body.color || '#666666',
            type,
            family_id,
            created_by: userId
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('创建分类失败:', error);
        res.status(500).json({ error: '创建分类失败' });
    }
}

// 获取家庭的所有分类（包括默认分类和自定义分类）
export async function getCategoriesByFamily(req: Request, res: Response) {
    try {
        const family_id = parseInt(req.params.familyId);

        if (!family_id || isNaN(family_id)) {
            return res.status(400).json({ error: '无效的家庭ID' });
        }

        // 获取默认分类
        const defaultCategories = await categoryModel.getDefaultCategories();

        // 获取自定义分类
        const customCategories = await categoryModel.getCustomCategories(family_id);

        // 合并返回
        const categories = [...defaultCategories, ...customCategories];

        // 所有用户都能看到默认分类和自己家庭的自定义分类
        res.json(categories);
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({ error: '获取分类列表失败' });
    }
}

// 更新分类
export async function updateCategory(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const { name, icon, color } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        // 获取分类信息
        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 默认分类不能修改
        if (category.is_default) {
            return res.status(403).json({ error: '默认分类不能修改' });
        }

        // 验证当前用户是否有权限修改该分类（需要是该家庭成员）
        const isMember = await categoryModel.isUserInFamily(userId, category.family_id || 0);
        if (!isMember) {
            return res.status(403).json({ error: '无权修改此分类' });
        }

        const updatedCategory = await categoryModel.updateCategory(id, {
            name,
            icon,
            color,
            updated_by: userId
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({ error: '更新分类失败' });
    }
}

// 删除分类
export async function deleteCategory(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const family_id = parseInt(req.params.familyId);

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        // 获取分类信息
        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 检查用户权限
        const isAdmin = req.user?.role === 'admin';

        // 默认分类只有管理员可以删除
        if (category.is_default && !isAdmin) {
            return res.status(403).json({ error: '只有管理员可以删除默认分类' });
        }

        // 确保只能删除当前家庭的分类
        if (!category.is_default && category.family_id !== family_id) {
            return res.status(403).json({ error: '无权删除此分类' });
        }

        await categoryModel.deleteCategory(id);
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({ error: '删除分类失败' });
    }
}

// 获取单个分类
export async function getCategoryById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const family_id = parseInt(req.params.familyId);

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 只能查看默认分类或当前家庭的分类
        if (!category.is_default && category.family_id !== family_id) {
            return res.status(403).json({ error: '无权查看此分类' });
        }

        res.json(category);
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ error: '获取分类失败' });
    }
}

// 获取默认分类
export async function getDefaultCategories(req: Request, res: Response) {
    try {
        const categories = await categoryModel.getDefaultCategories();
        res.json(categories);
    } catch (error) {
        console.error('获取默认分类失败:', error);
        res.status(500).json({ error: '获取默认分类失败' });
    }
}
