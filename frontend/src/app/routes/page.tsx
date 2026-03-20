"use client";

import React from 'react';
import { Card, CardBody, CardHeader, Button, Chip, Tabs, Tab, useDisclosure } from '@nextui-org/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, TrendingUp, BarChart3, FileText, ExternalLink, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
    getRoutePredictions,
    getRouteOptimizationSuggestions,
    exportRouteAnalysisReport,
    getRouteVisualizationData
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { RoutePredictionCard } from './components/RoutePredictionCard';
import { DataTable } from '@/components/DataTable';
import { RouteOptimizationModal } from './components/RouteOptimizationModal';
import { ExportReportModal } from './components/ExportReportModal';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import PageLayout from '@/components/PageLayout';

export default function RoutesPage() {
    const { user } = useAuth();
    const userId = user?.id;

    // 日期范围状态
    const [dateRange, setDateRange] = React.useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
    });

    // 管理优化建议弹窗
    const {
        isOpen: isOptimizationOpen,
        onOpen: onOptimizationOpen,
        onClose: onOptimizationClose
    } = useDisclosure();

    // 管理导出报告弹窗
    const {
        isOpen: isExportOpen,
        onOpen: onExportOpen,
        onClose: onExportClose
    } = useDisclosure();

    // 选中的路由ID
    const [selectedRouteId, setSelectedRouteId] = React.useState<number | null>(null);

    // 获取路由预测
    const { data: predictions, isLoading: isPredictionsLoading } = useQuery({
        queryKey: ['routePredictions', userId],
        queryFn: () => getRoutePredictions(userId || 0),
        enabled: !!userId,
    });

    // 获取数据可视化
    const { data: visualizationData, isLoading: isVisualizationLoading } = useQuery({
        queryKey: ['routeVisualization', dateRange],
        queryFn: () => getRouteVisualizationData({
            type: 'performance',
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString()
        }),
        enabled: !!userId,
    });

    // 性能数据列定义
    const performanceColumns = [
        {
            header: '路由路径',
            accessorKey: 'name',
            cell: (info: any) => (
                <div className="flex items-center">
                    <span className="text-sm">{info.row.original.name}</span>
                </div>
            )
        },
        {
            header: '加载时间 (ms)',
            accessorKey: 'loadTime',
            cell: (info: any) => {
                const value = info.row.original.loadTime;
                let color = 'success';
                if (value > 500) color = 'danger';
                else if (value > 300) color = 'warning';

                return (
                    <Chip color={color as any} variant="flat" size="sm">
                        {value} ms
                    </Chip>
                );
            }
        },
        {
            header: '错误率 (%)',
            accessorKey: 'errorRate',
            cell: (info: any) => {
                const value = info.row.original.errorRate;
                let color = 'success';
                if (value > 1.0) color = 'danger';
                else if (value > 0.5) color = 'warning';

                return (
                    <Chip color={color as any} variant="flat" size="sm">
                        {value}%
                    </Chip>
                );
            }
        },
        {
            header: '缓存命中率 (%)',
            accessorKey: 'cacheHitRate',
            cell: (info: any) => {
                const value = info.row.original.cacheHitRate;
                let color = 'success';
                if (value < 60) color = 'danger';
                else if (value < 80) color = 'warning';

                return (
                    <Chip color={color as any} variant="flat" size="sm">
                        {value}%
                    </Chip>
                );
            }
        },
        {
            header: '操作',
            cell: (info: any) => {
                const routeId = info.row.original.id as number | undefined;
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            startContent={<TrendingUp size={14} />}
                            isDisabled={!routeId}
                            onPress={() => {
                                if (routeId) {
                                    setSelectedRouteId(routeId);
                                    onOptimizationOpen();
                                }
                            }}
                        >
                            优化建议
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={<ExternalLink size={14} />}
                            isDisabled={!routeId}
                            as="a"
                            href={routeId ? `/settings/routes?highlight=${routeId}` : '#'}
                            target="_blank"
                        >
                            管理
                        </Button>
                    </div>
                )
            }
        }
    ];

    // 处理报告导出
    const handleExportReport = async (format: 'pdf' | 'csv' | 'excel') => {
        try {
            const blob = await exportRouteAnalysisReport({
                format,
                startDate: dateRange.startDate.toISOString(),
                endDate: dateRange.endDate.toISOString()
            });

            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `route-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`成功导出${format.toUpperCase()}报告`);
        } catch (error) {
            toast.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    const headerActions = (
        <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button
                color="primary"
                variant="shadow"
                startContent={<FileText size={16} />}
                onPress={onExportOpen}
            >
                导出报告
            </Button>
        </div>
    );

    return (
        <PageLayout
            title="路由管理"
            description="分析路由访问表现，生成预测与优化建议。"
            actions={headerActions}
            backgroundVariant="minimal"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex gap-3 px-6 py-4">
                        <ArrowRightLeft size={24} className="text-primary" />
                        <div>
                            <h2 className="text-xl font-bold">路由预测</h2>
                            <p className="text-sm text-default-500">基于用户行为的路由访问预测</p>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {isPredictionsLoading ? (
                                <div className="col-span-3 text-center py-4">加载中...</div>
                            ) : (
                                (predictions?.topRoutes || Array(3).fill({})).map((prediction: any) => {
                                    const predictionKey = prediction?.path || prediction?.name || `prediction-${prediction?.confidence || 'unknown'}`;
                                    return (
                                        <RoutePredictionCard
                                            key={predictionKey}
                                            prediction={prediction}
                                            isLoading={isPredictionsLoading}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex gap-3 px-6 py-4">
                        <BarChart3 size={24} className="text-primary" />
                        <div>
                            <h2 className="text-xl font-bold">路由性能</h2>
                            <p className="text-sm text-default-500">监控路由加载时间和错误率</p>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <Tabs>
                            <Tab key="table" title="表格视图">
                                <DataTable
                                    columns={performanceColumns}
                                    data={visualizationData?.data || []}
                                    isLoading={isVisualizationLoading}
                                />
                            </Tab>
                            <Tab key="chart" title="图表视图">
                                <div className="w-full h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={visualizationData?.data || []}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="loadTime" name="加载时间 (ms)" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
            </div>

            <RouteOptimizationModal
                isOpen={isOptimizationOpen}
                onClose={onOptimizationClose}
                routeId={selectedRouteId || 0}
                fetchSuggestions={getRouteOptimizationSuggestions}
            />

            <ExportReportModal
                isOpen={isExportOpen}
                onClose={onExportClose}
                onExport={handleExportReport}
                dateRange={dateRange}
                setDateRange={setDateRange}
            />
        </PageLayout>
    );
}
