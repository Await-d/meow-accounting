/*
 * @Author: Await
 * @Date: 2025-03-15 12:35:31
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 16:06:09
 * @Description: 账户路由
 */
import express from 'express';
import {
    createAccount,
    getAccount,
    updateAccount,
    deleteAccount,
    getAccounts
} from '../controllers/account.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// 创建账户
router.post('/', authenticate, createAccount);

// 获取单个账户
router.get('/:id', authenticate, getAccount);

// 获取账户列表（支持按用户ID或家庭ID筛选）
router.get('/', authenticate, getAccounts);

// 更新账户
router.put('/:id', authenticate, updateAccount);

// 删除账户
router.delete('/:id', authenticate, deleteAccount);

export default router; 