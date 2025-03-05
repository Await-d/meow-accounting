/*
 * @Author: Await
 * @Date: 2025-03-05 19:37:26
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:38:33
 * @Description: 请填写简介
 */
import express from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 通过邮箱查找用户
router.get('/search', userController.findUserByEmail);

export default router; 