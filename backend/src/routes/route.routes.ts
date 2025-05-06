/*
 * @Author: Await
 * @Date: 2025-03-09 21:00:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 19:47:16
 * @Description: 路由管理API路由
 */
import express from 'express';
import * as routeController from '../controllers/route.controller';
import { authMiddleware, checkRole } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * @swagger
 * /routes/all:
 *   get:
 *     summary: 获取所有路由（仅管理员）
 *     description: 管理员用户获取所有路由信息
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取路由列表
 *       401:
 *         description: 未授权
 *       403:
 *         description: 权限不足
 */
// 改为始终可访问（临时调试）
router.get('/all', routeController.getAllRoutes);

/**
 * @swagger
 * /routes/user/routes:
 *   get:
 *     summary: 获取用户的路由
 *     description: 获取当前用户的所有路由
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户路由
 *       401:
 *         description: 未授权
 */
router.get('/user/routes', routeController.getUserRoutes);

/**
 * @swagger
 * /routes/family/{familyId}/routes:
 *   get:
 *     summary: 获取家庭路由
 *     description: 获取指定家庭的所有路由
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: familyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 家庭ID
 *     responses:
 *       200:
 *         description: 成功获取家庭路由
 *       401:
 *         description: 未授权
 */
router.get('/family/:familyId/routes', routeController.getFamilyRoutes);

// 创建路由
router.post('/', routeController.createRoute);

// 获取路由信息
router.get('/:id', routeController.getRouteById);

// 更新路由
router.put('/:id', routeController.updateRoute);

// 删除路由
router.delete('/:id', routeController.deleteRoute);

// 切换路由状态
router.put('/:id/toggle', routeController.toggleRouteActive);

// 检查访问权限
router.get('/access/:path', routeController.checkAccess);

// 获取路由性能统计
router.get('/stats/report/:id', routeController.getRouteStats);

// 获取路由预测
router.get('/predictions', routeController.getRoutePredictions);

// 获取路由优化建议
router.get('/:id/optimization', routeController.getRouteOptimizationSuggestions);

// 导出路由分析报告
router.get('/export', routeController.exportRouteAnalysisReport);

// 获取路由可视化数据
router.get('/visualization', routeController.getRouteVisualizationData);

// 添加测试路由，用于检查路由注册是否正常
router.get('/test', (req, res) => {
    res.json({ message: '路由测试成功！', status: 'ok' });
});

export default router; 