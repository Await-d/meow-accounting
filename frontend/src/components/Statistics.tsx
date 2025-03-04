'use client';

import { useEffect } from 'react';
import { Card, CardBody } from '@nextui-org/react';
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
    const { data: statistics, isLoading, error } = useStatistics();
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast('获取统计数据失败', 'error');
        }
    }, [error, showToast]);

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
        </div>
    );
} 