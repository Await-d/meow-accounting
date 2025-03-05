'use client';

import { useEffect, useState } from 'react';
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
} from '@nextui-org/react';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useStatistics } from '@/lib/api';
import { useToast } from './Toast';
import Skeleton from './Skeleton';
import type { Statistics as StatisticsType } from '@/lib/types';

// 注册Chart.js组件
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function Statistics() {
    const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
    const { data: statistics, isLoading, error } = useStatistics(timeRange);
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast('获取统计数据失败', 'error');
        }
    }, [error, showToast]);

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
        return <Skeleton type="statistics" />;
    }

    const { summary: { totalIncome = 0, totalExpense = 0 }, details = [] } = statistics;
    const balance = totalIncome - totalExpense;

    // 按类型分组处理数据
    const incomeDetails = details.filter(d => d.type === 'income');
    const expenseDetails = details.filter(d => d.type === 'expense');

    const monthlyData = {
        labels: expenseDetails.map(d => d.category_name),
        datasets: [
            {
                label: '收入',
                data: incomeDetails.map(d => d.total_amount),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
            },
            {
                label: '支出',
                data: expenseDetails.map(d => d.total_amount),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
            },
        ],
    };

    const categoryData = {
        labels: expenseDetails.map(d => d.category_name),
        datasets: [
            {
                data: expenseDetails.map(d => d.total_amount),
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                ],
            },
        ],
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Select
                    label="时间范围"
                    selectedKeys={new Set([timeRange])}
                    onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'year')}
                    className="w-48"
                >
                    <SelectItem key="month" value="month">本月</SelectItem>
                    <SelectItem key="quarter" value="quarter">本季度</SelectItem>
                    <SelectItem key="year" value="year">本年</SelectItem>
                </Select>

                <Button
                    color="primary"
                    variant="flat"
                    startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
                    onPress={exportToCSV}
                >
                    导出数据
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="col-span-1">
                    <CardBody>
                        <div className="text-center">
                            <p className="text-default-500">本月收入</p>
                            <p className="text-success text-2xl font-bold">¥{totalIncome.toFixed(2)}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="col-span-1">
                    <CardBody>
                        <div className="text-center">
                            <p className="text-default-500">本月支出</p>
                            <p className="text-danger text-2xl font-bold">¥{totalExpense.toFixed(2)}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card className="col-span-1">
                    <CardBody>
                        <div className="text-center">
                            <p className="text-default-500">本月结余</p>
                            <p className="text-primary text-2xl font-bold">¥{balance.toFixed(2)}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="col-span-1">
                    <CardBody>
                        <h3 className="text-lg font-semibold mb-4">收支趋势</h3>
                        <Line
                            data={monthlyData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top' as const,
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                    },
                                },
                            }}
                        />
                    </CardBody>
                </Card>
                <Card className="col-span-1">
                    <CardBody>
                        <h3 className="text-lg font-semibold mb-4">支出分类</h3>
                        <Pie
                            data={categoryData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'right' as const,
                                    },
                                },
                            }}
                        />
                    </CardBody>
                </Card>
            </div>

            <Card>
                <CardBody>
                    <h3 className="text-lg font-semibold mb-4">详细统计</h3>
                    <Table aria-label="分类统计详情">
                        <TableHeader>
                            <TableColumn>分类</TableColumn>
                            <TableColumn>类型</TableColumn>
                            <TableColumn>交易次数</TableColumn>
                            <TableColumn>总金额</TableColumn>
                            <TableColumn>占比</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {details.map((detail) => {
                                const total = detail.type === 'income' ? totalIncome : totalExpense;
                                const percentage = total > 0 ? (detail.total_amount / total * 100).toFixed(2) : '0.00';

                                return (
                                    <TableRow key={`${detail.category_name}-${detail.type}`}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{detail.category_icon}</span>
                                                <span>{detail.category_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={detail.type === 'income' ? 'text-success' : 'text-danger'}>
                                                {detail.type === 'income' ? '收入' : '支出'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{detail.transaction_count}</TableCell>
                                        <TableCell>¥{detail.total_amount.toFixed(2)}</TableCell>
                                        <TableCell>{percentage}%</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
} 