'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
    Card,
    CardBody,
    Progress,
    Chip,
    Select,
    SelectItem,
    Button,
    ButtonGroup,
    Tabs,
    Tab,
    Tooltip,
} from '@nextui-org/react';
import { Pie, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip as ChartTooltip,
    Legend,
    ChartData,
} from 'chart.js';
import { useCategoryStats } from '@/hooks/useCategoryStats';
import { useAuth } from '@/hooks/useAuth';
import { CategoryStats as CategoryStatsType, TimeRange } from '@/lib/types';
import Skeleton from './Skeleton';
import { ArrowUpIcon, ArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// 注册 Chart.js 组件
ChartJS.register(ArcElement, ChartTooltip, Legend);

// 定义颜色常量
const CHART_COLORS = [
    'rgba(54, 162, 235, 0.8)',   // 蓝色
    'rgba(255, 99, 132, 0.8)',   // 红色
    'rgba(75, 192, 192, 0.8)',   // 青色
    'rgba(255, 159, 64, 0.8)',   // 橙色
    'rgba(153, 102, 255, 0.8)',  // 紫色
    'rgba(255, 205, 86, 0.8)',   // 黄色
    'rgba(201, 203, 207, 0.8)',  // 灰色
    'rgba(100, 255, 100, 0.8)',  // 绿色
    'rgba(200, 100, 100, 0.8)',  // 棕红色
    'rgba(100, 100, 255, 0.8)',  // 蓝紫色
];

// 图表配置选项
const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            callbacks: {
                label: function (context: any) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
                }
            }
        }
    },
    animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: 'easeOutQuart' as const,
    },
    cutout: '65%', // 中心孔的大小
};

interface CategoryStatsProps {
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
}

export default function CategoryStats({
    timeRange,
    onTimeRangeChange
}: CategoryStatsProps) {
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [chartType, setChartType] = useState<'pie' | 'doughnut'>('doughnut');
    const [sortBy, setSortBy] = useState<'amount' | 'name'>('amount');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const { user } = useAuth();
    const { data: stats, isLoading, error } = useCategoryStats(timeRange);
    const errorDisplayed = useRef(false);

    // 当有错误时，避免重复渲染导致的无限循环
    useEffect(() => {
        if (error && !errorDisplayed.current) {
            console.error('获取分类统计数据失败:', error);
            errorDisplayed.current = true;
        }
    }, [error]);

    // 过滤并排序数据
    const filteredStats = useMemo(() => {
        if (!stats) return [];

        const filtered = stats.filter((item: CategoryStatsType) => item.type === type);

        return [...filtered].sort((a, b) => {
            if (sortBy === 'amount') {
                return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
            } else {
                return sortOrder === 'desc'
                    ? b.name.localeCompare(a.name)
                    : a.name.localeCompare(b.name);
            }
        });
    }, [stats, type, sortBy, sortOrder]);

    // 准备图表数据
    const getChartData = (type: 'pie' | 'doughnut') => {
        if (!filteredStats || filteredStats.length === 0) {
            return {
                labels: ['暂无数据'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e5e7eb'],
                }]
            };
        }

        return {
            labels: filteredStats.map(item => item.name),
            datasets: [{
                data: filteredStats.map(item => item.amount),
                backgroundColor: filteredStats.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
                borderWidth: 1,
                hoverOffset: 8,
            }]
        };
    };

    // 计算总额
    const totalAmount = useMemo(() => {
        if (!filteredStats || filteredStats.length === 0) return 0;
        return filteredStats.reduce((sum, item) => sum + item.amount, 0);
    }, [filteredStats]);

    if (isLoading) {
        return <Skeleton type="statistics" />;
    }

    if (error) {
        return (
            <Card className="w-full">
                <CardBody className="flex flex-col items-center justify-center p-8 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-warning mb-4" />
                    <h3 className="text-lg font-semibold mb-2">获取分类统计数据失败</h3>
                    <p className="text-default-500 mb-4">
                        {error instanceof Error ? error.message : '请检查网络连接并稍后再试'}
                    </p>
                </CardBody>
            </Card>
        );
    }

    // 检查是否有统计数据
    if (!stats || stats.length === 0) {
        return (
            <Card className="w-full">
                <CardBody className="flex flex-col items-center justify-center p-8 gap-4">
                    <p className="text-default-500">暂无分类统计数据</p>
                    <p className="text-sm text-default-400">添加更多交易记录以查看分类统计</p>
                </CardBody>
            </Card>
        );
    }

    // 检查当前类型是否有数据
    if (filteredStats.length === 0) {
        return (
            <Card className="w-full">
                <CardBody className="space-y-4">
                    <div className="flex justify-between items-center">
                        <ButtonGroup>
                            <Button
                                color={type === 'expense' ? 'danger' : 'default'}
                                variant={type === 'expense' ? 'solid' : 'bordered'}
                                onPress={() => setType('expense')}
                            >
                                支出
                            </Button>
                            <Button
                                color={type === 'income' ? 'success' : 'default'}
                                variant={type === 'income' ? 'solid' : 'bordered'}
                                onPress={() => setType('income')}
                            >
                                收入
                            </Button>
                        </ButtonGroup>

                        <Select
                            size="sm"
                            className="w-36"
                            selectedKeys={[timeRange]}
                            onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
                        >
                            <SelectItem key="week" value="week">本周</SelectItem>
                            <SelectItem key="month" value="month">本月</SelectItem>
                            <SelectItem key="quarter" value="quarter">本季度</SelectItem>
                            <SelectItem key="year" value="year">本年</SelectItem>
                        </Select>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 gap-2">
                        <p className="text-default-500">暂无{type === 'expense' ? '支出' : '收入'}分类数据</p>
                        <Button
                            color={type === 'expense' ? 'success' : 'danger'}
                            variant="flat"
                            className="mt-2"
                            onPress={() => setType(type === 'expense' ? 'income' : 'expense')}
                        >
                            查看{type === 'expense' ? '收入' : '支出'}分类
                        </Button>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Tabs
                    selectedKey={type}
                    onSelectionChange={(key) => setType(key as 'expense' | 'income')}
                    color={type === 'expense' ? 'danger' : 'success'}
                    variant="bordered"
                    size="sm"
                    classNames={{
                        tabList: "gap-2",
                    }}
                >
                    <Tab key="expense" title="支出" />
                    <Tab key="income" title="收入" />
                </Tabs>

                <div className="flex items-center gap-2">
                    <ButtonGroup size="sm">
                        <Tooltip content="饼图" placement="top">
                            <Button
                                isIconOnly
                                variant={chartType === 'pie' ? 'solid' : 'bordered'}
                                color="primary"
                                onPress={() => setChartType('pie')}
                            >
                                ◔
                            </Button>
                        </Tooltip>
                        <Tooltip content="环形图" placement="top">
                            <Button
                                isIconOnly
                                variant={chartType === 'doughnut' ? 'solid' : 'bordered'}
                                color="primary"
                                onPress={() => setChartType('doughnut')}
                            >
                                ◕
                            </Button>
                        </Tooltip>
                    </ButtonGroup>

                    <Select
                        size="sm"
                        className="w-24 min-w-fit"
                        selectedKeys={[timeRange]}
                        onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
                    >
                        <SelectItem key="week" value="week">本周</SelectItem>
                        <SelectItem key="month" value="month">本月</SelectItem>
                        <SelectItem key="quarter" value="quarter">本季度</SelectItem>
                        <SelectItem key="year" value="year">本年</SelectItem>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 relative flex items-center justify-center">
                    {chartType === 'pie' ? (
                        <Pie data={getChartData('pie')} options={CHART_OPTIONS} />
                    ) : (
                        <Doughnut data={getChartData('doughnut')} options={CHART_OPTIONS} />
                    )}
                    {chartType === 'doughnut' && (
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <div className="text-xs text-default-500">总{type === 'expense' ? '支出' : '收入'}</div>
                            <div className={`text-lg font-bold ${type === 'expense' ? 'text-danger' : 'text-success'}`}>
                                ¥{totalAmount.toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-2 h-64 overflow-y-auto pr-1">
                    <div className="flex justify-between items-center text-xs text-default-500 px-2 py-1">
                        <Button
                            size="sm"
                            variant="light"
                            className="!p-1 min-w-8 h-6"
                            startContent={sortOrder === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            排序
                        </Button>
                        <ButtonGroup size="sm">
                            <Button
                                size="sm"
                                variant={sortBy === 'name' ? 'solid' : 'bordered'}
                                className="!p-1 min-w-8 h-6"
                                onPress={() => setSortBy('name')}
                            >
                                名称
                            </Button>
                            <Button
                                size="sm"
                                variant={sortBy === 'amount' ? 'solid' : 'bordered'}
                                className="!p-1 min-w-8 h-6"
                                onPress={() => setSortBy('amount')}
                            >
                                金额
                            </Button>
                        </ButtonGroup>
                    </div>
                    {filteredStats.map((item, index) => (
                        <Card key={item.name} className="w-full shadow-none border border-default-100 animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                            <CardBody className="py-2 px-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                        <span className="text-sm font-medium line-clamp-1">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className={`text-sm font-semibold ${type === 'expense' ? 'text-danger' : 'text-success'}`}>
                                        {item.amount.toFixed(2)}
                                    </div>
                                </div>
                                <div className="mt-1">
                                    <Progress
                                        size="sm"
                                        value={item.amount}
                                        maxValue={totalAmount}
                                        color={type === 'expense' ? 'danger' : 'success'}
                                        className="mt-1"
                                        showValueLabel={true}
                                        formatOptions={{ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                                    />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* 添加全局样式 */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
} 