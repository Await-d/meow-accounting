/*
 * @Author: Await
 * @Date: 2025-03-14 18:43:52
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 14:29:34
 * @Description: 请填写简介
 */
import React from 'react';
import { Spinner, Card, CardBody, CardHeader } from '@nextui-org/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Statistics as GlobalStatistics } from '@/lib/types';

// 本地Statistics类型与全局类型保持一致
type Statistics = {
    total_income: number;
    total_expense: number;
    chart: Array<{
        date: string;
        income: number;
        expense: number;
    }>;
};

type IncomeExpenseChartProps = {
    statistics?: Statistics | GlobalStatistics;
    isLoading: boolean;
    timeRange: 'month' | 'quarter' | 'year';
};

export default function IncomeExpenseChart({ statistics, isLoading, timeRange }: IncomeExpenseChartProps) {
    // 自定义柱状图样式
    const CustomBar = (props: any) => {
        const { x, y, width, height, fill } = props;

        return (
            <motion.rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                rx={4}
                ry={4}
                initial={{ height: 0, y: y + height }}
                animate={{ height, y }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
        );
    };

    // 自定义提示框
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-content1 p-3 rounded-lg shadow-lg border border-default-100">
                    <p className="text-sm font-medium text-foreground">{`日期: ${label}`}</p>
                    <div className="mt-2 space-y-1">
                        <p className="text-xs flex items-center">
                            <span className="w-3 h-3 inline-block mr-2 rounded-full bg-success"></span>
                            <span>收入: </span>
                            <span className="ml-1 font-medium text-success">{payload[0].value} 元</span>
                        </p>
                        <p className="text-xs flex items-center">
                            <span className="w-3 h-3 inline-block mr-2 rounded-full bg-danger"></span>
                            <span>支出: </span>
                            <span className="ml-1 font-medium text-danger">{payload[1].value} 元</span>
                        </p>
                    </div>
                </div>
            );
        }

        return null;
    };

    const timeRangeTitle = {
        month: '本月收支统计',
        quarter: '本季度收支统计',
        year: '本年收支统计'
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-0">
                    <h3 className="text-lg font-medium">{timeRangeTitle[timeRange]}</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex justify-center items-center h-[300px]">
                        <Spinner />
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (!statistics || !statistics.chart || statistics.chart.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-0">
                    <h3 className="text-lg font-medium">{timeRangeTitle[timeRange]}</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex justify-center items-center h-[300px]">
                        <p className="text-default-500">暂无数据</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border border-default-100">
            <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                <h4 className="font-bold text-large">收支趋势</h4>
                <p className="text-tiny text-default-500">
                    {timeRange === 'month' ? '本月' : timeRange === 'quarter' ? '本季度' : '本年'}收支情况
                    {statistics && ` (总收入: ${formatCurrency(statistics.total_income)}, 总支出: ${formatCurrency(statistics.total_expense)})`}
                </p>
            </CardHeader>
            <CardBody className="overflow-hidden py-5">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={statistics.chart}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--success)" stopOpacity={0.2} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--default-200)" opacity={0.3} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'var(--foreground-500)' }}
                                    axisLine={{ stroke: 'var(--default-200)' }}
                                    tickLine={{ stroke: 'var(--default-200)' }}
                                />
                                <YAxis
                                    tick={{ fill: 'var(--foreground-500)' }}
                                    axisLine={{ stroke: 'var(--default-200)' }}
                                    tickLine={{ stroke: 'var(--default-200)' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: 10 }} />
                                <Bar
                                    dataKey="income"
                                    name="收入"
                                    fill="url(#incomeGradient)"
                                    shape={<CustomBar />}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="expense"
                                    name="支出"
                                    fill="url(#expenseGradient)"
                                    shape={<CustomBar />}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardBody>
        </Card>
    );
} 