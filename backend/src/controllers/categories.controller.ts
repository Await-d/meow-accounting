/*
 * @Author: Await
 * @Date: 2025-03-15 17:05:30
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 17:05:30
 * @Description: 分类控制器
 */
import { Request, Response, NextFunction } from 'express';
import * as categoryModel from '../models/category';

// 获取默认分类
export const getDefaultCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as 'income' | 'expense' | undefined;

        // 获取默认分类
        const categories = await categoryModel.getDefaultCategories(type);

        res.json(categories);
    } catch (error) {
        console.error('获取默认分类失败:', error);
        next(error);
    }
};

// 获取家庭自定义分类
export const getCustomCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const familyId = parseInt(req.params.familyId);
        const type = req.query.type as 'income' | 'expense' | undefined;

        if (isNaN(familyId)) {
            return res.status(400).json({ error: '无效的家庭ID' });
        }

        // 验证用户是否属于该家庭
        if (req.user) {
            const isMember = await categoryModel.isUserInFamily(req.user.id, familyId);
            if (!isMember) {
                return res.status(403).json({ error: '无权访问该家庭的分类' });
            }
        }

        // 获取自定义分类
        const categories = await categoryModel.getCustomCategories(familyId, type);

        res.json(categories);
    } catch (error) {
        console.error('获取家庭自定义分类失败:', error);
        next(error);
    }
};

// 创建自定义分类
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const { name, type, icon, color, family_id } = req.body;

        // 验证必要参数
        if (!name || !type || !family_id) {
            return res.status(400).json({ error: '分类名称、类型和家庭ID都是必填项' });
        }

        // 验证用户是否属于该家庭
        const isMember = await categoryModel.isUserInFamily(req.user.id, parseInt(family_id));
        if (!isMember) {
            return res.status(403).json({ error: '无权为该家庭创建分类' });
        }

        // 创建分类
        const category = await categoryModel.createCategory({
            name,
            type,
            icon: icon || 'tag',
            color: color || '#1976D2',
            family_id: parseInt(family_id),
            created_by: req.user.id
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('创建分类失败:', error);
        next(error);
    }
};

// 更新分类
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const id = parseInt(req.params.id);
        const { name, icon, color } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        // 获取分类信息
        const category = await categoryModel.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 验证是否为默认分类
        if (category.is_default) {
            return res.status(400).json({ error: '默认分类不能修改' });
        }

        // 验证用户是否属于该家庭
        if (category.family_id) {
            const isMember = await categoryModel.isUserInFamily(req.user.id, category.family_id);
            if (!isMember) {
                return res.status(403).json({ error: '无权修改该分类' });
            }
        }

        // 更新分类
        const updatedCategory = await categoryModel.updateCategory(id, {
            name,
            icon,
            color,
            updated_by: req.user.id
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error('更新分类失败:', error);
        next(error);
    }
};

// 删除分类
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        // 获取分类信息
        const category = await categoryModel.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 验证是否为默认分类
        if (category.is_default) {
            return res.status(400).json({ error: '默认分类不能删除' });
        }

        // 验证用户是否属于该家庭
        if (category.family_id) {
            const isMember = await categoryModel.isUserInFamily(req.user.id, category.family_id);
            if (!isMember) {
                return res.status(403).json({ error: '无权删除该分类' });
            }
        }

        // 检查分类是否被使用
        const isInUse = await categoryModel.isCategoryInUse(id);
        if (isInUse) {
            return res.status(400).json({ error: '该分类已被使用，无法删除' });
        }

        // 删除分类
        await categoryModel.deleteCategory(id);

        res.json({ message: '分类删除成功' });
    } catch (error) {
        console.error('删除分类失败:', error);
        next(error);
    }
}; 