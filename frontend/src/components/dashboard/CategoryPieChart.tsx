import React from 'react';
import { Spinner } from '@nextui-org/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type CategoryStats = {
    id: number;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    color?: string;
};

type CategoryPieChartProps = {
    data?: CategoryStats[];
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

    // 只展示支出类别
    const expenseData = data.filter(item => item.type === 'expense');

    if (expenseData.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">暂无支出数据</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                    {expenseData.map((entry, index) => (
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