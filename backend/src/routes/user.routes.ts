/*
 * @Author: Await
 * @Date: 2025-03-05 19:37:26
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:39:08
 * @Description: 请填写简介
 */
import express from 'express';
import {
    getProfile,
    updateProfile,
    updatePassword,
    updatePrivacy,
    verifyGuest,
    getAllUsers,
    searchUsers
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkAdminRole } from '../middleware/admin.middleware';

const router = express.Router();

// 获取用户资料
router.get('/profile', authenticate, getProfile);

// 更新用户资料
router.put('/profile', authenticate, updateProfile);

// 修改密码
router.put('/password', authenticate, updatePassword);

// 隐私设置
router.put('/privacy', authenticate, updatePrivacy);

// 验证访客密码
router.post('/verify-guest', verifyGuest);

// 管理员接口 - 获取所有用户
router.get('/all', authenticate, checkAdminRole, getAllUsers);

// 通过邮箱查找用户
router.get('/search', authenticate, searchUsers);

export default router;
