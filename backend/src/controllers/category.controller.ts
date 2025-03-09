/*
 * @Author: Await
 * @Date: 2025-03-05 21:21:50
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 09:51:14
 * @Description: 请填写简介
 */
import {Request, Response} from 'express';
import * as categoryModel from '../models/category';

// 创建分类
export async function createCategory(req: Request, res: Response) {
    try {
        const {name, icon, type, family_id} = req.body;

        if (!name || !type || !family_id) {
            return res.status(400).json({error: '缺少必要参数'});
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({error: '类型必须是收入或支出'});
        }

        // 自定义分类必须关联到家庭
        const category = await categoryModel.createCategory({
            name,
            icon,
            type,
            family_id,
            is_default: false // 用户创建的分类永远不是默认分类
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('创建分类失败:', error);
        res.status(500).json({error: '创建分类失败'});
    }
}

// 获取家庭的所有分类（包括默认分类和自定义分类）
export async function getCategoriesByFamily(req: Request, res: Response) {
    try {
        const family_id = parseInt(req.params.familyId);

        if (!family_id || isNaN(family_id)) {
            return res.status(400).json({error: '无效的家庭ID'});
        }

        // 获取所有默认分类和当前家庭的自定义分类
        const categories = await categoryModel.getFamilyCategories(family_id);

        // 根据用户角色过滤分类
        const isAdmin = req.user?.role === 'admin';

        // 所有用户都能看到默认分类和自己家庭的自定义分类
        res.json(categories);
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({error: '获取分类列表失败'});
    }
}

// 更新分类
export async function updateCategory(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const family_id = parseInt(req.params.familyId);
        const {name, icon, type} = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({error: '无效的分类ID'});
        }

        // 获取分类信息
        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({error: '分类不存在'});
        }

        // 检查用户权限
        const isAdmin = req.user?.role === 'admin';

        // 默认分类只有管理员可以修改
        if (category.is_default && !isAdmin) {
            return res.status(403).json({error: '只有管理员可以修改默认分类'});
        }

        // 确保只能修改当前家庭的分类
        if (!category.is_default && category.family_id !== family_id) {
            return res.status(403).json({error: '无权修改此分类'});
        }

        const updatedCategory = await categoryModel.updateCategory(id, {
            name,
            icon,
            type
        });

        res.json(updatedCategory);
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({error: '更新分类失败'});
    }
}

// 删除分类
export async function deleteCategory(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const family_id = parseInt(req.params.familyId);

        if (!id || isNaN(id)) {
            return res.status(400).json({error: '无效的分类ID'});
        }

        // 获取分类信息
        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({error: '分类不存在'});
        }

        // 检查用户权限
        const isAdmin = req.user?.role === 'admin';

        // 默认分类只有管理员可以删除
        if (category.is_default && !isAdmin) {
            return res.status(403).json({error: '只有管理员可以删除默认分类'});
        }

        // 确保只能删除当前家庭的分类
        if (!category.is_default && category.family_id !== family_id) {
            return res.status(403).json({error: '无权删除此分类'});
        }

        await categoryModel.deleteCategory(id);
        res.json({message: '删除成功'});
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({error: '删除分类失败'});
    }
}

// 获取单个分类
export async function getCategoryById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const family_id = parseInt(req.params.familyId);

        if (!id || isNaN(id)) {
            return res.status(400).json({error: '无效的分类ID'});
        }

        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({error: '分类不存在'});
        }

        // 只能查看默认分类或当前家庭的分类
        if (!category.is_default && category.family_id !== family_id) {
            return res.status(403).json({error: '无权查看此分类'});
        }

        res.json(category);
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({error: '获取分类失败'});
    }
}

// 获取默认分类
export async function getDefaultCategories(req: Request, res: Response) {
    try {
        const categories = await categoryModel.getDefaultCategories();
        res.json(categories);
    } catch (error) {
        console.error('获取默认分类失败:', error);
        res.status(500).json({error: '获取默认分类失败'});
    }
}
