/*
 * @Author: Await
 * @Date: 2025-03-04 18:48:07
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 19:58:47
 * @Description: 请填写简介
 */
import {Router} from 'express';
import * as transactionController from '../controllers/transactionController';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import familyRoutes from './family.routes';
import categoryRoutes from './category.routes';
import transactionRoutes from './transaction.routes';
import statisticsRoutes from './statistics.routes';
import routeRoutes from './route.routes';

const router = Router();

// 交易记录路由
router.get('/transactions', transactionController.getAllTransactions);
router.get('/transactions/range', transactionController.getTransactionsByDateRange);
router.post('/transactions', transactionController.createTransaction);
router.put('/transactions/:id', transactionController.updateTransaction);
router.delete('/transactions/:id', transactionController.deleteTransaction);

// 统计路由
router.get('/statistics', transactionController.getStatistics);

// 注册路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/families', familyRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/routes', routeRoutes);

export default router;
