/*
 * @Author: Await
 * @Date: 2025-03-04 18:48:07
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 19:58:47
 * @Description: 请填写简介
 */
import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import familyRoutes from './family.routes';
import categoryRoutes from './category.routes';
import transactionRoutes from './transaction.routes';
import statisticsRoutes from './statistics.routes';
import routeRoutes from './route.routes';
import * as routeController from '../controllers/route.controller';
import * as routeStatsController from '../controllers/route-stats.controller';
import * as routeParamsController from '../controllers/route-params.controller';
import * as settingsController from '../controllers/settings.controller';
import { authMiddleware } from '../middlewares/auth';

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

// 路由管理
router.get('/routes/user/routes', authMiddleware, routeController.getUserRoutes);
router.get('/routes/family/:familyId/routes', authMiddleware, routeController.getFamilyRoutes);
router.post('/routes', authMiddleware, routeController.createRoute);
router.get('/routes/:id', authMiddleware, routeController.getRouteById);
router.put('/routes/:id', authMiddleware, routeController.updateRoute);
router.delete('/routes/:id', authMiddleware, routeController.deleteRoute);
router.get('/routes/access/:path', authMiddleware, routeController.checkAccess);

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
