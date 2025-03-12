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

// 管理员获取所有路由（需要管理员权限）
router.get('/all', checkRole(['admin']), routeController.getAllRoutes);

// 获取用户的所有路由
router.get('/user/routes', routeController.getUserRoutes);

// 获取家庭的所有路由
router.get('/family/:familyId/routes', routeController.getFamilyRoutes);

// 创建路由
router.post('/', routeController.createRoute);

// 获取路由信息
router.get('/:id', routeController.getRouteById);

// 更新路由
router.put('/:id', routeController.updateRoute);

// 删除路由
router.delete('/:id', routeController.deleteRoute);

export default router; 