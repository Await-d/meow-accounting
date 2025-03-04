/*
 * @Author: Await
 * @Date: 2025-03-04 18:48:07
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 18:48:12
 * @Description: 请填写简介
 */
import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import * as transactionController from '../controllers/transactionController';
import statisticsRoutes from './statistics.routes';

const router = Router();

// 分类路由
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// 交易记录路由
router.get('/transactions', transactionController.getAllTransactions);
router.get('/transactions/range', transactionController.getTransactionsByDateRange);
router.post('/transactions', transactionController.createTransaction);
router.put('/transactions/:id', transactionController.updateTransaction);
router.delete('/transactions/:id', transactionController.deleteTransaction);

// 统计路由
router.get('/statistics', transactionController.getStatistics);

router.use('/statistics', statisticsRoutes);

export default router; 