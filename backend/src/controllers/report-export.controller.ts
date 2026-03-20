/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 报告导出控制器
 */
import { Request, Response, NextFunction } from 'express';
import { reportExportService } from '../services/report-export.service';
import { APIError } from '../middleware/error';
import dayjs from 'dayjs';

/**
 * 导出路由性能报告
 */
export const exportRoutePerformanceReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const format = (req.query.format as string) || 'json';

        if (!['json', 'csv'].includes(format)) {
            throw new APIError(400, '不支持的导出格式');
        }

        const report = await reportExportService.generateRoutePerformanceReport(userId, format as 'json' | 'csv');

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="route-performance-${dayjs().format('YYYY-MM-DD')}.csv"`);
            res.send('\ufeff' + report); // 添加BOM以支持Excel正确识别UTF-8
        } else {
            res.json({
                code: 200,
                data: report,
                message: '导出成功'
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * 导出财务分析报告
 */
export const exportFinancialReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const familyId = req.user?.currentFamilyId || null;

        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const format = (req.query.format as string) || 'json';
        const startDate = (req.query.startDate as string) || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        const endDate = (req.query.endDate as string) || dayjs().format('YYYY-MM-DD');

        if (!['json', 'csv'].includes(format)) {
            throw new APIError(400, '不支持的导出格式');
        }

        const report = await reportExportService.generateFinancialReport(
            userId,
            familyId,
            startDate,
            endDate,
            format as 'json' | 'csv'
        );

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="financial-report-${dayjs().format('YYYY-MM-DD')}.csv"`);
            res.send('\ufeff' + report);
        } else {
            res.json({
                code: 200,
                data: report,
                message: '导出成功'
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * 导出综合分析报告
 */
export const exportComprehensiveReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const familyId = req.user?.currentFamilyId || null;

        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const format = (req.query.format as string) || 'json';
        const startDate = (req.query.startDate as string) || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        const endDate = (req.query.endDate as string) || dayjs().format('YYYY-MM-DD');

        if (!['json', 'csv', 'excel'].includes(format)) {
            throw new APIError(400, '不支持的导出格式');
        }

        if (format === 'excel') {
            const excelData = await reportExportService.generateExcelReport(
                userId,
                familyId,
                startDate,
                endDate
            );

            res.json({
                code: 200,
                data: excelData,
                message: '导出数据已生成，请在前端使用Excel库转换'
            });
        } else {
            const report = await reportExportService.generateComprehensiveReport(
                userId,
                familyId,
                startDate,
                endDate,
                format as 'json' | 'csv'
            );

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="comprehensive-report-${dayjs().format('YYYY-MM-DD')}.csv"`);
                res.send('\ufeff' + report);
            } else {
                res.json({
                    code: 200,
                    data: report,
                    message: '导出成功'
                });
            }
        }
    } catch (error) {
        next(error);
    }
};

/**
 * 获取可导出报告列表
 */
export const getAvailableReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未授权访问');
        }

        const reports = [
            {
                id: 'route-performance',
                name: '路由性能报告',
                description: '包含路由访问统计、响应时间、错误率等性能指标',
                formats: ['json', 'csv'],
                endpoint: '/api/reports/export/route-performance'
            },
            {
                id: 'financial',
                name: '财务分析报告',
                description: '包含收支统计、分类分布、趋势分析等财务数据',
                formats: ['json', 'csv'],
                endpoint: '/api/reports/export/financial',
                requiresDateRange: true
            },
            {
                id: 'comprehensive',
                name: '综合分析报告',
                description: '包含路由性能和财务分析的完整报告',
                formats: ['json', 'csv', 'excel'],
                endpoint: '/api/reports/export/comprehensive',
                requiresDateRange: true
            }
        ];

        res.json({
            code: 200,
            data: reports,
            message: '获取成功'
        });
    } catch (error) {
        next(error);
    }
};
