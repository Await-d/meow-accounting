/*
 * @Author: Await
 * @Date: 2025-03-05 20:47:58
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 21:26:14
 * @Description: 请填写简介
 */
import express from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth';
import { familyMemberMiddleware } from '../middleware/family';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 创建事务
router.post('/', familyMemberMiddleware, transactionController.createTransaction);

// 获取事务列表
router.get('/', familyMemberMiddleware, transactionController.getTransactions);

// 获取事务详情
router.get('/:id', familyMemberMiddleware, transactionController.getTransactionById);

// 更新事务
router.put('/:id', familyMemberMiddleware, transactionController.updateTransaction);

// 删除事务
router.delete('/:id', familyMemberMiddleware, transactionController.deleteTransaction);

// 获取分类统计
router.get('/stats/category', familyMemberMiddleware, transactionController.getCategoryStats);

export default router; 