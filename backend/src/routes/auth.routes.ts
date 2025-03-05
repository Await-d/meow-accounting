/*
 * @Author: Await
 * @Date: 2025-03-05 19:24:27
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:24:49
 * @Description: 请填写简介
 */
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

export default router; 