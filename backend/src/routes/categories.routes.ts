/*
 * @Author: Await
 * @Date: 2025-03-15 18:15:10
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 18:15:10
 * @Description: 分类路由
 */
import { Router } from 'express';
import * as categoriesController from '../controllers/categories.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// 获取默认分类
router.get('/default', categoriesController.getDefaultCategories);

// 获取家庭自定义分类
router.get('/family/:familyId', authenticate, categoriesController.getCustomCategories);

// 创建自定义分类
router.post('/', authenticate, categoriesController.createCategory);

// 更新分类
router.put('/:id', authenticate, categoriesController.updateCategory);

// 删除分类
router.delete('/:id', authenticate, categoriesController.deleteCategory);

export default router; 