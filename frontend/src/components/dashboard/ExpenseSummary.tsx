/*
 * @Author: Await
 * @Date: 2025-03-15 11:16:33
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 12:30:24
 * @Description: 请填写简介
 */
import React from 'react';
import { Card, CardBody, CardHeader, Divider, Skeleton, Spinner, Chip, Progress } from '@nextui-org/react';
import { TrendingDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';

interface ExpenseSummaryProps {
    transactions: Transaction[];
    isLoading?: boolean;
    isPersonalMode?: boolean;
}

const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
    transactions,
    isLoading = false,
    isPersonalMode = false
}) => {
    // 计算本月总支出
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthlyExpenses = transactions
        ?.filter(t =>
            t.type === 'expense' &&
            new Date(t.date) >= startOfMonth &&
            new Date(t.date) <= today
        )
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    // 按类别分组支出
    const expensesByCategory: Record<string, number> = {};
    transactions
        ?.filter(t =>
            t.type === 'expense' &&
            new Date(t.date) >= startOfMonth &&
            new Date(t.date) <= today
        )
        .forEach(t => {
            // 使用category_name或category_id
            const categoryName = t.category_name || `分类ID:${t.category_id}` || '未分类';
            expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + t.amount;
        });

    // 获取前三大支出类别
    const topCategories = Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, amount]) => ({
            name: category,
            amount: amount,
            percentage: (amount / monthlyExpenses) * 100
        }));

    const previousMonthDiff = topCategories.length > 1 ? (topCategories[0].percentage - topCategories[1].percentage) : null;

    const formatCurrency = (value: number) => `¥${value.toFixed(2)}`;
    const getCategoryColor = (index: number) => {
        if (index === 0) return 'danger';
        if (index === 1) return 'warning';
        return 'success';
    };

    return (
        <Card className="h-full border border-default-100">
            <CardHeader className="flex gap-3 items-center">
                <div className="p-2 rounded-full bg-danger/10">
                    <TrendingDown size={20} className="text-danger" />
                </div>
                <div className="flex flex-col">
                    <p className="text-md font-semibold">
                        {isPersonalMode ? "我的支出" : "家庭支出"}
                    </p>
                    <p className="text-small text-default-500">本月支出统计</p>
                </div>
            </CardHeader>
            <CardBody className="py-2">
                {isLoading ? (
                    <Spinner size="sm" />
                ) : (
                    <>
                        <div className="flex items-center gap-1">
                            <p className="text-3xl font-bold text-danger">
                                {formatCurrency(monthlyExpenses)}
                            </p>
                            {previousMonthDiff !== null && (
                                <Chip
                                    size="sm"
                                    variant="flat"
                                    color={previousMonthDiff > 0 ? "danger" : "success"}
                                    className="ml-2"
                                    startContent={previousMonthDiff > 0 ?
                                        <ChevronUp className="h-3 w-3" /> :
                                        <ChevronDown className="h-3 w-3" />}
                                >
                                    {Math.abs(previousMonthDiff).toFixed(0)}%
                                </Chip>
                            )}
                        </div>

                        <p className="text-sm text-default-500 mt-1 mb-3">
                            {isPersonalMode ? "较上月" : "家庭总支出较上月"}
                            {previousMonthDiff !== null && (
                                <span className={previousMonthDiff > 0 ? "text-danger" : "text-success"}>
                                    {previousMonthDiff > 0 ? " 增加" : " 减少"}
                                    {Math.abs(previousMonthDiff).toFixed(0)}%
                                </span>
                            )}
                        </p>

                        <div className="space-y-3">
                            {topCategories.map((category, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-medium">{category.name}</p>
                                        <p className="text-sm">{formatCurrency(category.amount)}</p>
                                    </div>
                                    <Progress
                                        value={category.percentage}
                                        color={getCategoryColor(index)}
                                        size="sm"
                                        className="h-1"
                                        aria-label={`${category.name}支出百分比`}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default ExpenseSummary; 