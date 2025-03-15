/*
 * @Author: Await
 * @Date: 2025-03-15 12:29:12
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 14:20:05
 * @Description: 最近交易记录组件
 */
import React from 'react';
import { Card, CardBody, Button, Skeleton, Avatar } from '@nextui-org/react';
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '@/lib/types';

interface RecentTransactionsProps {
    transactions: Transaction[];
    isLoading?: boolean;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (id: string | number) => void;
    isPersonalMode?: boolean;
    userId?: number | string;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
    transactions,
    isLoading = false,
    onEdit,
    onDelete,
    isPersonalMode = false,
    userId
}) => {
    // 格式化日期
    const formatDate = (date: Date | string) => {
        return format(new Date(date), 'yyyy-MM-dd');
    };

    // 格式化货币
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // 是否为当前用户的交易
    const isCurrentUserTransaction = (transaction: Transaction) => {
        return transaction.user_id === userId;
    };

    // 过滤有效的交易记录，并按日期排序
    const filteredTransactions = transactions
        ? [...transactions]
            .filter(t => t && t.id)
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
            .slice(0, 5)
        : [];

    return (
        <div className="w-full">
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                </div>
            ) : !filteredTransactions.length ? (
                <div className="text-center py-8">
                    <p className="text-default-500 mb-2">
                        {isPersonalMode ? "您暂无交易记录" : "暂无家庭交易记录"}
                    </p>
                    <Button
                        size="sm"
                        color="primary"
                        onPress={() => onEdit && onEdit({} as Transaction)}
                    >
                        添加第一笔交易
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.map((transaction, index) => (
                        <Card key={transaction.id || index} className="bg-content1/50">
                            <CardBody className="p-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-success/10' : 'bg-danger/10'
                                        }`}>
                                        {transaction.type === 'income' ? (
                                            <ArrowUpRight size={20} className="text-success" />
                                        ) : (
                                            <ArrowDownRight size={20} className="text-danger" />
                                        )}
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{transaction.category_name || '未分类'}</p>
                                                <p className="text-xs text-default-500">
                                                    {formatDate(transaction.date || new Date())}
                                                    {!isPersonalMode && transaction.user_id && (
                                                        <span className={`ml-2 ${isCurrentUserTransaction(transaction) ? 'text-primary font-medium' : 'text-default-500'}`}>
                                                            {transaction.username || `用户${transaction.user_id}`}
                                                            {isCurrentUserTransaction(transaction) && ' (我)'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-danger'
                                                    }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                {transaction.description && (
                                                    <p className="text-xs text-default-500">{transaction.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => onEdit && onEdit(transaction)}
                                        >
                                            <Pencil size={16} />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => onDelete && onDelete(transaction.id)}
                                            className="text-danger"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentTransactions; 