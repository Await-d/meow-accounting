/*
 * @Author: Await
 * @Date: 2025-03-05 19:32:28
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:32:49
 * @Description: 请填写简介
 */
import express from 'express';
import * as familyController from '../controllers/family.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 创建家庭
router.post('/', familyController.createFamily);

// 获取用户的所有家庭
router.get('/user', familyController.getUserFamilies);

// 获取家庭信息
router.get('/:id', familyController.getFamilyById);

// 获取家庭成员
router.get('/:id/members', familyController.getFamilyMembers);

// 添加家庭成员
router.post('/:id/members', familyController.addFamilyMember);

// 更新成员角色
router.put('/:id/members/:userId/role', familyController.updateMemberRole);

// 移除家庭成员
router.delete('/:id/members/:userId', familyController.removeFamilyMember);

export default router; 