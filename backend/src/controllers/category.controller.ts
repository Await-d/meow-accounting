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

        const category = await categoryModel.createCategory({
            name,
            icon,
            type,
            family_id
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('创建分类失败:', error);
        res.status(500).json({ error: '创建分类失败' });
    }
}

// 获取家庭的所有分类
export async function getCategoriesByFamily(req: Request, res: Response) {
    try {
        const family_id = parseInt(req.params.familyId);

        if (!family_id || isNaN(family_id)) {
            return res.status(400).json({ error: '无效的家庭ID' });
        }

        const categories = await categoryModel.getCategoriesByFamilyId(family_id);
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
        const { name, icon, type } = req.body;
        const family_id = parseInt(req.params.familyId);

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        // 验证分类是否属于该家庭
        const belongs = await categoryModel.isCategoryInFamily(id, family_id);
        if (!belongs) {
            return res.status(403).json({ error: '无权操作此分类' });
        }

        if (type && type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: '类型必须是收入或支出' });
        }

        const category = await categoryModel.updateCategory(id, {
            name,
            icon,
            type
        });

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        res.json(category);
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

        // 验证分类是否属于该家庭
        const belongs = await categoryModel.isCategoryInFamily(id, family_id);
        if (!belongs) {
            return res.status(403).json({ error: '无权操作此分类' });
        }

        await categoryModel.deleteCategory(id);
        res.json({ message: '分类删除成功' });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({ error: '删除分类失败' });
    }
}

// 获取分类详情
export async function getCategoryById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const family_id = parseInt(req.params.familyId);

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: '无效的分类ID' });
        }

        // 验证分类是否属于该家庭
        const belongs = await categoryModel.isCategoryInFamily(id, family_id);
        if (!belongs) {
            return res.status(403).json({ error: '无权查看此分类' });
        }

        const category = await categoryModel.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        res.json(category);
    } catch (error) {
        console.error('获取分类详情失败:', error);
        res.status(500).json({ error: '获取分类详情失败' });
    }
} 