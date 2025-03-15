/*
 * @Author: Await
 * @Date: 2025-03-04 18:48:07
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:40:17
 * @Description: 请填写简介
 */
import express from 'express';
import * as transactionController from '../controllers/transaction.controller';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import familyRoutes from './family.routes';
import categoryRoutes from './categories.routes';
import transactionRoutes from './transaction.routes';
import accountRoutes from './account.routes';
import routeRoutes from './route.routes';
import statisticsRoutes from './statistics.routes';
import cacheRoutes from './cache';
import * as routeController from '../controllers/route.controller';
import * as routeStatsController from '../controllers/route-stats.controller';
import * as routeParamsController from '../controllers/route-params.controller';
import * as settingsController from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth';
import { Router } from 'express';

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
router.use('/accounts', accountRoutes);
router.use('/routes', routeRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/cache', cacheRoutes);

// 路由性能监控
router.post('/routes/stats/access', authMiddleware, routeStatsController.recordAccess);
router.get('/routes/stats/report', authMiddleware, routeStatsController.getPerformanceReport);
router.delete('/routes/stats/:routeId', authMiddleware, routeStatsController.clearPerformanceData);
router.get('/routes/stats/cache/:routeId', authMiddleware, routeStatsController.getCacheStats);
router.get('/routes/stats/preheat', authMiddleware, routeStatsController.getPreheatStatus);

// 路由参数管理
router.post('/routes/:routeId/params', authMiddleware, routeParamsController.saveParams);
router.get('/routes/:routeId/params', authMiddleware, routeParamsController.getParams);
router.delete('/routes/:routeId/params', authMiddleware, routeParamsController.clearParams);
router.get('/routes/params/all', authMiddleware, routeParamsController.getAllParams);

// 用户设置管理
router.get('/users/settings', authMiddleware, settingsController.getSettings);
router.put('/users/settings', authMiddleware, settingsController.updateSettings);
router.post('/users/settings/reset', authMiddleware, settingsController.resetSettings);
router.get('/users/settings/export', authMiddleware, settingsController.exportSettings);
router.post('/users/settings/import', authMiddleware, settingsController.importSettings);

export default router;
