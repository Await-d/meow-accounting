/*
 * @Author: Await
 * @Date: 2025-03-05 19:32:28
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 19:57:56
 * @Description: 请填写简介
 */
import express from 'express';
import * as familyController from '../controllers/family.controller';
import {authMiddleware} from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 创建家庭
router.post('/', familyController.createFamily);

// 获取用户的所有家庭
router.get('/user', familyController.getUserFamilies);

// 获取用户的待处理邀请
router.get('/invitations', familyController.getUserInvitations);

// 获取邀请信息
router.get('/invitations/:token', familyController.getInvitation);

// 接受邀请
router.post('/invitations/:token/accept', familyController.acceptInvitation);

// 拒绝邀请
router.post('/invitations/:token/reject', familyController.rejectInvitation);

// 获取家庭信息
router.get('/:id', familyController.getFamilyById);

// 更新家庭信息
router.put('/:id', familyController.updateFamily);

// 删除家庭
router.delete('/:id', familyController.deleteFamily);

// 获取家庭成员
router.get('/:id/members', familyController.getFamilyMembers);

// 添加家庭成员（现在是创建邀请）
router.post('/:id/members', familyController.addFamilyMember);

// 获取家庭的所有邀请
router.get('/:id/invitations', familyController.getFamilyInvitations);

// 删除邀请
router.delete('/:id/invitations/:invitationId', familyController.deleteInvitation);

// 更新成员角色
router.put('/:id/members/:userId/role', familyController.updateMemberRole);

// 移除家庭成员
router.delete('/:id/members/:userId', familyController.removeFamilyMember);

export default router;
