/*
 * @Author: Await
 * @Date: 2025-03-09 09:52:48
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 12:54:26
 * @Description: 请填写简介
 */
import express, { Request } from 'express';
import * as categoryModel from '../models/category';
import { authMiddleware } from '../middleware/auth';
import { familyMemberMiddleware } from '../middleware/family';
import { checkAdminRole } from '../middleware/admin';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

// 获取默认分类
router.get('/default', authMiddleware, async (req, res) => {
    console.log('匹配路由: /default');
    try {
        const defaultCategories = await categoryModel.getDefaultCategories();
        res.json(defaultCategories);
    } catch (error) {
        console.error('获取默认分类失败:', error);
        res.status(500).json({ error: '获取默认分类失败' });
    }
});

// 获取家庭的自定义分类
router.get('/:familyId/custom', authMiddleware, familyMemberMiddleware, async (req, res) => {
    console.log('匹配路由: /:familyId/custom, familyId =', req.params.familyId);
    const familyIdStr = req.params.familyId;

    // 验证familyId是否为有效数字
    if (!familyIdStr || isNaN(parseInt(familyIdStr))) {
        console.error('无效的家庭ID:', familyIdStr);
        return res.status(400).json({ error: '无效的家庭ID' });
    }

    const familyId = parseInt(familyIdStr);

    try {
        // 获取家庭自定义分类
        const allCategories = await categoryModel.getFamilyCategories(familyId);
        // 过滤出非默认分类
        const customCategories = allCategories.filter(category => !category.is_default);
        console.log(`获取到家庭ID=${familyId}的自定义分类:`, customCategories);
        res.json(customCategories);
    } catch (error) {
        console.error('获取自定义分类失败:', error);
        res.status(500).json({ error: '获取自定义分类失败' });
    }
});

// 获取家庭的所有分类（包括默认分类和自定义分类）
// 使用正则表达式限制familyId只匹配数字，避免匹配到 /:familyId/custom
router.get('/:familyId([0-9]+)', authMiddleware, familyMemberMiddleware, async (req, res) => {
    console.log('匹配路由: /:familyId, familyId =', req.params.familyId);
    const familyIdStr = req.params.familyId;

    // 验证familyId是否为有效数字
    if (!familyIdStr || isNaN(parseInt(familyIdStr))) {
        return res.status(400).json({ error: '无效的家庭ID' });
    }

    const familyId = parseInt(familyIdStr);

    try {
        // 获取所有分类（包括默认分类和自定义分类）
        const allCategories = await categoryModel.getFamilyCategories(familyId);
        res.json(allCategories);
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({ error: '获取分类失败' });
    }
});

// 创建分类的请求体验证
const createCategorySchema = z.object({
    name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
    icon: z.string().min(1, '图标不能为空'),
    type: z.enum(['income', 'expense'], { message: '类型必须是收入或支出' }),
    isDefault: z.boolean().optional(),
});

// 创建分类（从请求体获取family_id）
router.post('/',
    authMiddleware,
    (req, res, next) => {
        // 记录请求体，帮助调试
        console.log('创建分类请求体:', req.body);

        // 处理可能的字段名不匹配问题
        if (req.body.familyId && !req.body.family_id) {
            req.body.family_id = req.body.familyId;
        }

        // 处理is_default和isDefault字段名不匹配问题
        if (req.body.is_default !== undefined && req.body.isDefault === undefined) {
            req.body.isDefault = req.body.is_default;
        }

        next();
    },
    validateRequest(createCategorySchema.extend({
        family_id: z.number({ required_error: '家庭ID不能为空' })
    })),
    async (req: Request, res) => {
        const { name, icon, type, isDefault = false, family_id } = req.body;
        console.log('验证后的请求体:', { name, icon, type, isDefault, family_id });

        // 验证用户是否是该家庭的成员
        try {
            // 检查用户是否是该家庭的成员
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: '未授权访问' });
            }

            // 检查用户是否是该家庭的成员
            const isFamilyMember = await categoryModel.isUserInFamily(userId, family_id);
            if (!isFamilyMember && !isDefault) {
                return res.status(403).json({ error: '您不是该家庭的成员' });
            }

            // 如果是默认分类，需要管理员权限
            if (isDefault) {
                const isAdmin = await checkAdminRole(req, res, () => {
                });
                if (!isAdmin) {
                    return res.status(403).json({ error: '只有管理员可以创建默认分类' });
                }
            }

            // 创建分类
            const category = await categoryModel.createCategory({
                name,
                icon,
                type,
                family_id: isDefault ? null : family_id,
                is_default: isDefault
            });

            console.log('分类创建成功:', category);
            res.status(201).json(category);
        } catch (error) {
            console.error('创建分类失败:', error);
            res.status(500).json({ error: '创建分类失败' });
        }
    }
);

// 创建分类（从URL参数获取family_id）
router.post('/:familyId',
    authMiddleware,
    familyMemberMiddleware,
    validateRequest(createCategorySchema),
    async (req, res) => {
        const familyId = parseInt(req.params.familyId);
        const { name, icon, type, isDefault = false } = req.body;

        // 如果是默认分类，需要管理员权限
        if (isDefault) {
            const isAdmin = await checkAdminRole(req, res, () => {
            });
            if (!isAdmin) {
                return res.status(403).json({ error: '只有管理员可以创建默认分类' });
            }
        }

        try {
            // 创建分类
            const category = await categoryModel.createCategory({
                name,
                icon,
                type,
                family_id: isDefault ? null : familyId,
                is_default: isDefault
            });

            res.status(201).json(category);
        } catch (error) {
            console.error('创建分类失败:', error);
            res.status(500).json({ error: '创建分类失败' });
        }
    }
);

// 更新分类
router.put('/:familyId/:id', authMiddleware, familyMemberMiddleware, async (req: Request, res) => {
    const id = parseInt(req.params.id);
    const familyId = parseInt(req.params.familyId);
    const { name, icon, type } = req.body;

    console.log(`更新分类请求: familyId=${familyId}, id=${id}, body=`, req.body);

    try {
        // 检查分类是否存在
        const category = await categoryModel.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 检查用户是否是管理员
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'owner';
        console.log('用户角色:', req.user?.role, '是否是管理员:', isAdmin);

        // 默认分类只有管理员可以修改
        if (category.is_default && !isAdmin) {
            return res.status(403).json({ error: '默认分类不能修改' });
        }

        // 检查用户是否是该家庭的成员
        if (category.family_id) {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: '未授权访问' });
            }

            const canModify = await categoryModel.canUserModifyCategory(id, userId);

            if (!canModify) {
                return res.status(403).json({ error: '您不是该家庭的成员' });
            }
        }

        // 更新分类
        const updatedCategory = await categoryModel.updateCategory(id, {
            name,
            icon,
            type
        }, isAdmin);

        console.log('分类更新成功:', updatedCategory);
        res.json(updatedCategory);
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({ error: '更新分类失败' });
    }
});

// 删除分类
router.delete('/:familyId/:id', authMiddleware, familyMemberMiddleware, async (req: Request, res) => {
    const id = parseInt(req.params.id);
    const familyId = parseInt(req.params.familyId);

    console.log(`删除分类请求: familyId=${familyId}, id=${id}`);

    try {
        // 检查分类是否存在
        const category = await categoryModel.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 检查用户是否是管理员
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'owner';
        console.log('用户角色:', req.user?.role, '是否是管理员:', isAdmin);

        // 默认分类只有管理员可以删除
        if (category.is_default && !isAdmin) {
            return res.status(403).json({ error: '默认分类不能删除' });
        }

        // 检查用户是否是该家庭的成员
        if (category.family_id) {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: '未授权访问' });
            }

            const canModify = await categoryModel.canUserModifyCategory(id, userId);

            if (!canModify) {
                return res.status(403).json({ error: '您不是该家庭的成员' });
            }
        }

        // 删除分类
        await categoryModel.deleteCategory(id, isAdmin);

        console.log('分类删除成功');
        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({ error: '删除分类失败' });
    }
});

// 保留原来的路由，以便兼容旧的请求
// 更新分类
router.put('/:id', authMiddleware, async (req: Request, res) => {
    const id = parseInt(req.params.id);
    const { name, icon, type } = req.body;

    try {
        // 检查分类是否存在
        const category = await categoryModel.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 检查用户是否是管理员
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'owner';
        console.log('用户角色:', req.user?.role, '是否是管理员:', isAdmin);

        // 默认分类只有管理员可以修改
        if (category.is_default && !isAdmin) {
            return res.status(403).json({ error: '默认分类不能修改' });
        }

        // 检查用户是否是该家庭的成员
        if (category.family_id) {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: '未授权访问' });
            }

            const canModify = await categoryModel.canUserModifyCategory(id, userId);

            if (!canModify) {
                return res.status(403).json({ error: '您不是该家庭的成员' });
            }
        }

        // 更新分类
        const updatedCategory = await categoryModel.updateCategory(id, {
            name,
            icon,
            type
        }, isAdmin);

        res.json(updatedCategory);
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({ error: '更新分类失败' });
    }
});

// 删除分类
router.delete('/:id', authMiddleware, async (req: Request, res) => {
    const id = parseInt(req.params.id);

    try {
        // 检查分类是否存在
        const category = await categoryModel.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }

        // 检查用户是否是管理员
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'owner';
        console.log('用户角色:', req.user?.role, '是否是管理员:', isAdmin);

        // 默认分类只有管理员可以删除
        if (category.is_default && !isAdmin) {
            return res.status(403).json({ error: '默认分类不能删除' });
        }

        // 检查用户是否是该家庭的成员
        if (category.family_id) {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: '未授权访问' });
            }

            const canModify = await categoryModel.canUserModifyCategory(id, userId);

            if (!canModify) {
                return res.status(403).json({ error: '您不是该家庭的成员' });
            }
        }

        // 删除分类
        await categoryModel.deleteCategory(id, isAdmin);

        res.json({ message: '删除成功' });
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({ error: '删除分类失败' });
    }
});

export default router;
