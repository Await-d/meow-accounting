'use client';

import { useEffect, useState, useRef } from 'react';
import {
    Card,
    CardBody,
    Select,
    SelectItem,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Skeleton,
    Chip,
} from '@nextui-org/react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useStatistics } from '@/lib/api';
import { useToast } from './Toast';
import { Statistics as StatisticsType } from '@/lib/types';
import { APIError } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';

// 注册Chart.js组件
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// 添加图表配置
const CHART_COLORS = {
    income: {
        main: 'rgb(34, 197, 94)',
        bg: 'rgba(34, 197, 94, 0.5)',
        hover: 'rgba(34, 197, 94, 0.7)'
    },
    expense: {
        main: 'rgb(239, 68, 68)',
        bg: 'rgba(239, 68, 68, 0.5)',
        hover: 'rgba(239, 68, 68, 0.7)'
    }
};

export default function Statistics() {
    const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
    const { data: statistics, isLoading, error } = useStatistics(timeRange);
    const { showToast } = useToast();
    const { handleUnauthorized } = useAuth();
    const processedErrorRef = useRef<string | null>(null);

    // 添加图表类型切换功能
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    useEffect(() => {
        if (error?.message && processedErrorRef.current !== error.message) {
            processedErrorRef.current = error.message;

            if (error instanceof APIError && error.status === 401) {
                handleUnauthorized();
            } else {
                showToast('获取统计数据失败', 'error');
            }
        }
    }, [error?.message, handleUnauthorized, showToast]);

    // 导出CSV
    const exportToCSV = () => {
        if (!statistics) return;

        const { details } = statistics;
        const headers = ['分类', '类型', '交易次数', '总金额'];
        const rows = details.map(d => [
            d.category_name,
            d.type === 'income' ? '收入' : '支出',
            d.transaction_count,
            d.total_amount.toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `统计数据_${new Date().toLocaleDateString()}.csv`;
        link.click();
    };

    if (isLoading || !statistics) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="w-48 h-10" />
                    <Skeleton className="w-32 h-10" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="w-full">
                            <CardBody className="space-y-3">
                                <Skeleton className="w-3/4 h-4" />
                                <Skeleton className="w-2/3 h-6" />
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const chartData = {
        labels: statistics.chart.map(item => {
            // 根据时间范围格式化日期标签
            const date = dayjs(item.date);
            if (timeRange === 'month') {
                return date.format('DD日');
            } else if (timeRange === 'quarter') {
                return date.format('MM月DD日');
            } else {
                return date.format('MM月');
            }
        }),
        datasets: [
            {
                label: '收入',
                data: statistics.chart.map(item => item.income),
                borderColor: CHART_COLORS.income.main,
                backgroundColor: chartType === 'line' ? CHART_COLORS.income.bg : CHART_COLORS.income.main,
                tension: 0.4,
                hoverBackgroundColor: CHART_COLORS.income.hover,
                borderRadius: 4
            },
            {
                label: '支出',
                data: statistics.chart.map(item => item.expense),
                borderColor: CHART_COLORS.expense.main,
                backgroundColor: chartType === 'line' ? CHART_COLORS.expense.bg : CHART_COLORS.expense.main,
                tension: 0.4,
                hoverBackgroundColor: CHART_COLORS.expense.hover,
                borderRadius: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: 'system-ui',
                        size: 12
                    }
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: 10,
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += '¥' + context.parsed.y.toFixed(2);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    callback: function (value: any) {
                        return '¥' + value;
                    },
                    font: {
                        family: 'system-ui',
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        family: 'system-ui',
                        size: 11
                    }
                }
            }
        },
        elements: {
            line: {
                borderWidth: 2
            },
            point: {
                radius: 3,
                hoverRadius: 5
            }
        },
        animation: {
            duration: 800,
            easing: 'easeOutQuart' as const
        }
    };

    // 添加额外的统计数据和计算
    const calculatePercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    const incomeTrend = statistics.chart.map(item => item.income);
    const expenseTrend = statistics.chart.map(item => item.expense);

    const avgIncome = incomeTrend.reduce((sum, val) => sum + val, 0) / incomeTrend.length || 0;
    const avgExpense = expenseTrend.reduce((sum, val) => sum + val, 0) / expenseTrend.length || 0;

    // 计算收支比率
    const incomePercentage = calculatePercentage(statistics.total_income, statistics.total_income + statistics.total_expense);
    const expensePercentage = calculatePercentage(statistics.total_expense, statistics.total_income + statistics.total_expense);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="w-full bg-gradient-to-br from-success/5 to-success/20 shadow-sm transform transition-all hover:scale-105 hover:shadow-md">
                    <CardBody className="space-y-2 p-4">
                        <div className="text-sm text-default-600">总收入</div>
                        <div className="text-2xl font-bold text-success flex items-center gap-1">
                            <span className="text-lg">¥</span>
                            {statistics.total_income.toFixed(2)}
                        </div>
                        <div className="text-xs text-default-400 flex items-center gap-1">
                            <span>平均: ¥{avgIncome.toFixed(2)}</span>
                            <div className="w-full bg-default-100 rounded-full h-1 ml-2">
                                <div
                                    className="bg-success h-1 rounded-full"
                                    style={{ width: `${incomePercentage}%` }}
                                ></div>
                            </div>
                            <span>{incomePercentage}%</span>
                        </div>
                    </CardBody>
                </Card>
                <Card className="w-full bg-gradient-to-br from-danger/5 to-danger/20 shadow-sm transform transition-all hover:scale-105 hover:shadow-md">
                    <CardBody className="space-y-2 p-4">
                        <div className="text-sm text-default-600">总支出</div>
                        <div className="text-2xl font-bold text-danger flex items-center gap-1">
                            <span className="text-lg">¥</span>
                            {statistics.total_expense.toFixed(2)}
                        </div>
                        <div className="text-xs text-default-400 flex items-center gap-1">
                            <span>平均: ¥{avgExpense.toFixed(2)}</span>
                            <div className="w-full bg-default-100 rounded-full h-1 ml-2">
                                <div
                                    className="bg-danger h-1 rounded-full"
                                    style={{ width: `${expensePercentage}%` }}
                                ></div>
                            </div>
                            <span>{expensePercentage}%</span>
                        </div>
                    </CardBody>
                </Card>
                <Card className="w-full bg-gradient-to-br from-primary/5 to-primary/20 shadow-sm transform transition-all hover:scale-105 hover:shadow-md">
                    <CardBody className="space-y-2 p-4">
                        <div className="text-sm text-default-600">结余</div>
                        <div className={`text-2xl font-bold flex items-center gap-1 ${statistics.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                            <span className="text-lg">¥</span>
                            {statistics.balance.toFixed(2)}
                        </div>
                        <div className="text-xs text-default-400 flex items-center gap-1">
                            <span>收支比: </span>
                            <div className="w-full bg-default-100 rounded-full h-1 ml-2">
                                <div
                                    className="bg-primary h-1 rounded-full"
                                    style={{ width: `${statistics.balance >= 0 ? 100 : 100 - Math.abs(calculatePercentage(statistics.balance, statistics.total_expense))}%` }}
                                ></div>
                            </div>
                            <span>{statistics.balance >= 0 ? '盈余' : '赤字'}</span>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="bg-default-50 p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium">收支趋势</h3>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={chartType === 'line' ? 'solid' : 'bordered'}
                            color="primary"
                            onPress={() => setChartType('line')}
                        >
                            折线图
                        </Button>
                        <Button
                            size="sm"
                            variant={chartType === 'bar' ? 'solid' : 'bordered'}
                            color="primary"
                            onPress={() => setChartType('bar')}
                        >
                            柱状图
                        </Button>
                    </div>
                </div>
                <div className="h-[280px]">
                    {chartType === 'line' ? (
                        <Line data={chartData} options={chartOptions} />
                    ) : (
                        <Bar data={chartData} options={chartOptions} />
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <Select
                    label="时间范围"
                    selectedKeys={new Set([timeRange])}
                    onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
                    className="w-36 sm:w-48"
                    size="sm"
                >
                    <SelectItem key="month" value="month">本月</SelectItem>
                    <SelectItem key="quarter" value="quarter">本季度</SelectItem>
                    <SelectItem key="year" value="year">本年</SelectItem>
                </Select>

                <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
                    onPress={exportToCSV}
                >
                    导出数据
                </Button>
            </div>

            <div className="overflow-x-auto bg-default-50 rounded-lg shadow-sm p-4">
                <div className="mb-3 text-md font-medium">消费明细</div>
                <Table
                    aria-label="统计详情"
                    className="min-w-full"
                    removeWrapper
                    classNames={{
                        th: "bg-default-100 text-default-600 py-3 px-4 text-sm",
                        td: "py-3 px-4"
                    }}
                >
                    <TableHeader>
                        <TableColumn>分类</TableColumn>
                        <TableColumn>类型</TableColumn>
                        <TableColumn>交易次数</TableColumn>
                        <TableColumn>总金额</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="暂无数据">
                        {statistics.details.map((detail) => (
                            <TableRow key={`${detail.category_name}-${detail.type}`} className="border-b hover:bg-default-100">
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{detail.category_icon}</span>
                                        <span className="font-medium">{detail.category_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        color={detail.type === 'expense' ? 'danger' : 'success'}
                                        variant="flat"
                                        size="sm"
                                    >
                                        {detail.type === 'expense' ? '支出' : '收入'}
                                    </Chip>
                                </TableCell>
                                <TableCell>{detail.transaction_count}</TableCell>
                                <TableCell>
                                    <span className={`font-medium ${detail.type === 'expense' ? 'text-danger' : 'text-success'}`}>
                                        {detail.type === 'expense' ? '-' : '+'}¥{detail.total_amount.toFixed(2)}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
} 