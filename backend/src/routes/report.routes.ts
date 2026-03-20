/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 报告导出路由
 */
import express from 'express';
import * as reportExportController from '../controllers/report-export.controller';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取可导出报告列表
router.get('/available', reportExportController.getAvailableReports);

// 导出路由性能报告
router.get('/export/route-performance', reportExportController.exportRoutePerformanceReport);

// 导出财务分析报告
router.get('/export/financial', reportExportController.exportFinancialReport);

// 导出综合分析报告
router.get('/export/comprehensive', reportExportController.exportComprehensiveReport);

export default router;
