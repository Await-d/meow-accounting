import React from 'react';
import { Spinner } from '@nextui-org/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type CategoryData = {
    id: number;
    name: string;
    amount: number;
    count: number;
    icon?: string;
    color?: string;
};

type CategoryStatsFormat = {
    type: 'income' | 'expense';
    categories: CategoryData[];
};

type CategoryPieChartProps = {
    data?: CategoryStatsFormat[] | null;
    isLoading: boolean;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

export default function CategoryPieChart({ data, isLoading }: CategoryPieChartProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">暂无数据</p>
            </div>
        );
    }

    // 找到支出分类数据
    const expenseData = data.find(item => item.type === 'expense');

    if (!expenseData || !expenseData.categories || expenseData.categories.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">暂无支出数据</p>
            </div>
        );
    }

    // 排序并限制数量，避免太多类别导致图表混乱
    const sortedCategories = [...expenseData.categories]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8); // 最多显示8个分类

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart aria-label="支出分类饼图">
                <Pie
                    data={sortedCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    aria-label="支出分类占比饼图"
                >
                    {sortedCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [`${value} 元`, '']}
                    labelFormatter={(name) => `类别: ${name}`}
                />
            </PieChart>
        </ResponsiveContainer>
    );
} 