import { useState, useEffect } from 'react';
import { Card, CardBody, Select, SelectItem, Button, ButtonGroup, Spinner } from '@nextui-org/react';
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
import type { CategoryStats as CategoryStatsType, TimeRange } from '@/lib/types';

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

interface Props {
    timeRange: TimeRange;
    onTimeRangeChange?: (range: TimeRange) => void;
}

interface ChartDataset {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    tension?: number;
}

interface CategoryChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export default function CategoryStatsComponent({ timeRange, onTimeRangeChange }: Props) {
    const [chartType, setChartType] = useState<ChartType>('pie');
    const { data: categoryData = [], isLoading, error } = useCategoryStats(timeRange);
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast('获取分类统计失败', 'error');
        }
    }, [error, showToast]);

    if (error || isLoading) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (categoryData.length === 0) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
                暂无数据
            </div>
        );
    }

    // 生成日期标签（最近7天）
    const dateLabels = Array.from({ length: categoryData[0]?.trend?.length || 0 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - ((categoryData[0]?.trend?.length || 0) - 1 - i));
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    });

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
        labels: dateLabels,
        datasets: categoryData.map(category => ({
            label: category.name,
            data: category.trend || [],
            tension: 0.1,
            borderColor: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
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
                            onChange={(e) => onTimeRangeChange?.(e.target.value as TimeRange)}
                            className="min-w-[120px]"
                            classNames={{
                                trigger: "min-w-[120px]",
                                listbox: "min-w-[120px]"
                            }}
                            aria-label="选择时间范围"
                            label="时间范围"
                        >
                            <SelectItem key="week" value="week" aria-label="本周">本周</SelectItem>
                            <SelectItem key="month" value="month" aria-label="本月">本月</SelectItem>
                            <SelectItem key="quarter" value="quarter" aria-label="本季度">本季度</SelectItem>
                            <SelectItem key="year" value="year" aria-label="本年">本年</SelectItem>
                        </Select>
                        <ButtonGroup size="sm" aria-label="图表类型选择">
                            <Button
                                variant={chartType === 'pie' ? 'solid' : 'bordered'}
                                onPress={() => setChartType('pie')}
                                aria-label="切换为饼图"
                            >
                                饼图
                            </Button>
                            <Button
                                variant={chartType === 'line' ? 'solid' : 'bordered'}
                                onPress={() => setChartType('line')}
                                aria-label="切换为趋势图"
                            >
                                趋势
                            </Button>
                            <Button
                                variant={chartType === 'bar' ? 'solid' : 'bordered'}
                                onPress={() => setChartType('bar')}
                                aria-label="切换为柱状图"
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