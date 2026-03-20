/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 报告导出服务 - JSON/CSV格式
 */
import { routeStatsModel } from '../models/route-stats';
import { routePredictionModel } from '../models/route-prediction';
import { routeOptimizationModel } from '../models/route-optimization';
import * as transactionModel from '../models/transaction';
import dayjs from 'dayjs';

interface ReportData {
    metadata: {
        reportType: string;
        generatedAt: string;
        userId: number;
        dateRange?: {
            start: string;
            end: string;
        };
    };
    summary: any;
    details: any[];
}

export class ReportExportService {
    /**
     * 生成路由性能报告
     */
    async generateRoutePerformanceReport(userId: number, format: 'json' | 'csv' = 'json'): Promise<string | object> {
        const report = await routeStatsModel.getPerformanceReport(userId);
        const predictions = await routePredictionModel.predictByTimePattern(userId, 10);
        const optimizationSummary = await routeOptimizationModel.getSuggestionsSummary(userId);

        const reportData: ReportData = {
            metadata: {
                reportType: '路由性能分析报告',
                generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                userId
            },
            summary: {
                totalRoutes: report.totalRoutes,
                totalAccesses: report.totalAccesses,
                totalErrors: report.totalErrors,
                averageLoadTime: Math.round(report.averageLoadTime),
                optimizationSuggestions: optimizationSummary.unimplemented,
                topPredictions: predictions.slice(0, 3).map(p => ({
                    path: p.path,
                    confidence: p.confidence
                }))
            },
            details: Object.entries(report.routeStats).map(([path, stats]) => ({
                路由: path,
                访问次数: stats.accessCount,
                错误次数: stats.errorCount,
                平均响应时间ms: Math.round(stats.averageLoadTime),
                缓存命中率: `${((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)}%`,
                最后访问: stats.lastAccessed
            }))
        };

        if (format === 'csv') {
            return this.toCSV(reportData);
        }

        return reportData;
    }

    /**
     * 生成财务分析报告
     */
    async generateFinancialReport(
        userId: number,
        familyId: number | null,
        startDate: string,
        endDate: string,
        format: 'json' | 'csv' = 'json'
    ): Promise<string | object> {
        // 获取交易统计
        const stats = await transactionModel.getTransactionStats({
            userId: familyId ? undefined : userId,
            familyId: familyId || undefined,
            startDate,
            endDate
        });

        // 获取分类统计
        const categoryStats = await transactionModel.getTransactionCategoryStats({
            userId: familyId ? undefined : userId,
            familyId: familyId || undefined,
            startDate,
            endDate
        });

        // 解析分类统计数据
        const incomeData = categoryStats.find((s: any) => s.type === 'income')?.categories || [];
        const expenseData = categoryStats.find((s: any) => s.type === 'expense')?.categories || [];

        const reportData: ReportData = {
            metadata: {
                reportType: '财务分析报告',
                generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                userId,
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            },
            summary: {
                总收入: stats.totalIncome,
                总支出: stats.totalExpense,
                净收益: stats.totalIncome - stats.totalExpense,
                交易笔数: stats.chart?.length || 0,
                平均每日支出: Math.round(stats.totalExpense / Math.max(dayjs(endDate).diff(dayjs(startDate), 'day'), 1)),
                支出最多分类: expenseData[0]?.name || 'N/A'
            },
            details: [
                ...incomeData.map((cat: any) => ({
                    类型: '收入',
                    分类: cat.name,
                    金额: cat.amount,
                    占比: `${((cat.amount / stats.totalIncome) * 100).toFixed(1)}%`,
                    笔数: cat.count
                })),
                ...expenseData.map((cat: any) => ({
                    类型: '支出',
                    分类: cat.name,
                    金额: cat.amount,
                    占比: `${((cat.amount / stats.totalExpense) * 100).toFixed(1)}%`,
                    笔数: cat.count
                }))
            ]
        };

        if (format === 'csv') {
            return this.toCSV(reportData);
        }

        return reportData;
    }

    /**
     * 生成综合分析报告
     */
    async generateComprehensiveReport(
        userId: number,
        familyId: number | null,
        startDate: string,
        endDate: string,
        format: 'json' | 'csv' = 'json'
    ): Promise<string | object> {
        const [routeReport, financialReport] = await Promise.all([
            this.generateRoutePerformanceReport(userId, 'json'),
            this.generateFinancialReport(userId, familyId, startDate, endDate, 'json')
        ]);

        const reportData = {
            metadata: {
                reportType: '综合分析报告',
                generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                userId,
                dateRange: {
                    start: startDate,
                    end: endDate
                }
            },
            routePerformance: routeReport,
            financialAnalysis: financialReport
        };

        if (format === 'csv') {
            // CSV格式的综合报告包含两个部分
            const routeCsv = this.toCSV(routeReport as ReportData);
            const financialCsv = this.toCSV(financialReport as ReportData);
            return `# 路由性能报告\n${routeCsv}\n\n# 财务分析报告\n${financialCsv}`;
        }

        return reportData;
    }

    /**
     * 将报告数据转换为CSV格式
     */
    public toCSV(reportData: ReportData): string {
        const lines: string[] = [];

        // 添加元数据
        lines.push('# 报告元数据');
        lines.push(`报告类型,${reportData.metadata.reportType}`);
        lines.push(`生成时间,${reportData.metadata.generatedAt}`);
        if (reportData.metadata.dateRange) {
            lines.push(`日期范围,${reportData.metadata.dateRange.start} 至 ${reportData.metadata.dateRange.end}`);
        }
        lines.push('');

        // 添加摘要
        lines.push('# 报告摘要');
        Object.entries(reportData.summary).forEach(([key, value]) => {
            if (typeof value === 'object') {
                lines.push(`${key},${JSON.stringify(value)}`);
            } else {
                lines.push(`${key},${value}`);
            }
        });
        lines.push('');

        // 添加详细数据
        if (reportData.details && reportData.details.length > 0) {
            lines.push('# 详细数据');
            const headers = Object.keys(reportData.details[0]);
            lines.push(headers.join(','));

            reportData.details.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    // 如果值包含逗号，用引号包裹
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`;
                    }
                    return value;
                });
                lines.push(values.join(','));
            });
        }

        return lines.join('\n');
    }

    /**
     * 生成Excel格式报告（使用JSON表示，前端用库转换）
     */
    async generateExcelReport(
        userId: number,
        familyId: number | null,
        startDate: string,
        endDate: string
    ): Promise<object> {
        const comprehensiveReport = await this.generateComprehensiveReport(
            userId,
            familyId,
            startDate,
            endDate,
            'json'
        );

        // 返回结构化数据，前端使用 xlsx 或 exceljs 库生成实际的Excel文件
        return {
            fileName: `喵呜记账-综合报告-${dayjs().format('YYYY-MM-DD')}.xlsx`,
            sheets: [
                {
                    name: '概览',
                    data: comprehensiveReport
                },
                {
                    name: '路由性能',
                    data: (comprehensiveReport as any).routePerformance
                },
                {
                    name: '财务分析',
                    data: (comprehensiveReport as any).financialAnalysis
                }
            ]
        };
    }
}

export const reportExportService = new ReportExportService();
