import { useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem, Button, ButtonGroup } from '@nextui-org/react';
import { Pie, Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Colors
} from 'chart.js';
import { useCategoryStats } from '@/lib/api';
import { useToast } from './Toast';
import Skeleton from './Skeleton';
import type { CategoryStats as CategoryStatsType } from '@/lib/types';

// 注册Chart.js组件
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Colors
);

type ChartType = 'pie' | 'line' | 'bar';
type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export default function CategoryStats() {
    const [chartType, setChartType] = useState<ChartType>('pie');
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const { data: categoryData = [], isLoading, error } = useCategoryStats<CategoryStatsType[]>(timeRange);
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast('获取分类统计失败', 'error');
        }
    }, [error, showToast]);

    if (error || isLoading) {
        return <Skeleton type="category" />;
    }

    // 准备图表数据
    const pieData = {
        labels: categoryData.map(item => item.name),
        datasets: [{
            data: categoryData.map(item => item.amount),
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)',
            ],
        }],
    };

    const lineData = {
        labels: categoryData[0]?.trend?.map(t => t.date) || [],
        datasets: categoryData.map(category => ({
            label: category.name,
            data: category.trend?.map(t => t.amount) || [],
            tension: 0.1,
        })),
    };

    const barData = {
        labels: categoryData.map(item => item.name),
        datasets: [{
            label: '支出金额',
            data: categoryData.map(item => item.amount),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            title: {
                display: true,
                text: '分类统计',
            },
        },
    };

    const renderChart = () => {
        switch (chartType) {
            case 'pie':
                return <Pie data={pieData} options={chartOptions} />;
            case 'line':
                return <Line data={lineData} options={chartOptions} />;
            case 'bar':
                return <Bar data={barData} options={chartOptions} />;
            default:
                return null;
        }
    };

    return (
        <Card className="w-full">
            <CardBody className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">分类统计</h2>
                    <div className="flex gap-2">
                        <Select
                            size="sm"
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                        >
                            <SelectItem key="week" value="week">本周</SelectItem>
                            <SelectItem key="month" value="month">本月</SelectItem>
                            <SelectItem key="quarter" value="quarter">本季度</SelectItem>
                            <SelectItem key="year" value="year">本年</SelectItem>
                        </Select>
                        <ButtonGroup size="sm">
                            <Button
                                variant={chartType === 'pie' ? 'solid' : 'bordered'}
                                onPress={() => setChartType('pie')}
                            >
                                饼图
                            </Button>
                            <Button
                                variant={chartType === 'line' ? 'solid' : 'bordered'}
                                onPress={() => setChartType('line')}
                            >
                                趋势
                            </Button>
                            <Button
                                variant={chartType === 'bar' ? 'solid' : 'bordered'}
                                onPress={() => setChartType('bar')}
                            >
                                柱状图
                            </Button>
                        </ButtonGroup>
                    </div>
                </div>

                <div className="h-[300px]">
                    {renderChart()}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categoryData.map(category => (
                        <Card key={category.name} className="p-4">
                            <div className="text-center">
                                <p className="text-default-500">{category.name}</p>
                                <p className="text-xl font-bold">¥{category.amount.toFixed(2)}</p>
                                <p className="text-small text-default-400">
                                    {category.percentage.toFixed(1)}%
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
} 