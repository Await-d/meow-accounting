import express from 'express';
import * as categoryController from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth';
import { familyMemberMiddleware } from '../middleware/family';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 创建分类
router.post('/', familyMemberMiddleware, categoryController.createCategory);

// 获取家庭的所有分类
router.get('/:familyId', familyMemberMiddleware, categoryController.getCategoriesByFamily);

// 获取分类详情
router.get('/:familyId/:id', familyMemberMiddleware, categoryController.getCategoryById);

// 更新分类
router.put('/:familyId/:id', familyMemberMiddleware, categoryController.updateCategory);

// 删除分类
router.delete('/:familyId/:id', familyMemberMiddleware, categoryController.deleteCategory);

export default router; 