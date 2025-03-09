/*
 * @Author: Await
 * @Date: 2025-03-05 20:47:58
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 21:35:35
 * @Description: 请填写简介
 */
import express from 'express';
import * as transactionController from '../controllers/transaction.controller';
import {authMiddleware} from '../middleware/auth';
import {familyMemberMiddleware} from '../middleware/family';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 统计相关路由
router.get('/stats', familyMemberMiddleware, transactionController.getStatistics);
router.get('/stats/category', familyMemberMiddleware, transactionController.getCategoryStats);

// 事务相关路由
router.post('/', familyMemberMiddleware, transactionController.createTransaction);
router.get('/', familyMemberMiddleware, transactionController.getTransactions);
router.get('/:id', familyMemberMiddleware, transactionController.getTransactionById);
router.put('/:id', familyMemberMiddleware, transactionController.updateTransaction);
router.delete('/:id', familyMemberMiddleware, transactionController.deleteTransaction);

export default router;
