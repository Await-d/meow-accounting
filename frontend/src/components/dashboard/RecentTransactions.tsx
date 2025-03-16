/*
 * @Author: Await
 * @Date: 2025-03-15 12:29:12
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 13:39:18
 * @Description: 最近交易记录组件
 */
import React, { useMemo } from 'react';
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
    limit?: number;
    onViewMore?: () => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
    transactions,
    isLoading = false,
    onEdit,
    onDelete,
    isPersonalMode = false,
    userId,
    limit = 5,
    onViewMore
}) => {
    // 检查传入的交易数据
    console.log('RecentTransactions组件接收到的交易数据:', transactions);

    // 格式化日期
    const formatDate = (date: Date | string) => {
        if (!date) return '';
        try {
            return format(new Date(date), 'yyyy-MM-dd');
        } catch (error) {
            console.error('日期格式化错误:', error, date);
            return '';
        }
    };

    // 格式化货币
    const formatCurrency = (amount: number | string) => {
        if (amount === undefined || amount === null) return '';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '';

        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(numAmount);
    };

    // 是否为当前用户的交易
    const isCurrentUserTransaction = (transaction: Transaction) => {
        if (!transaction || !userId) return false;

        // 处理不同格式的user_id
        const transactionUserId = transaction.user_id || transaction.createdBy;
        const currentUserId = Number(userId);

        return transactionUserId === currentUserId;
    };

    // 过滤有效的交易记录，并按日期排序
    const filteredTransactions = useMemo(() => {
        if (!transactions) {
            console.log('交易数据为null或undefined');
            return [];
        }

        if (!Array.isArray(transactions)) {
            console.log('交易数据不是数组类型:', typeof transactions);
            return [];
        }

        if (transactions.length === 0) {
            console.log('交易数组为空');
            return [];
        }

        console.log('过滤前交易数量:', transactions.length);

        // 添加数据完整性检查
        const validTransactions = transactions.filter(t =>
            t !== null &&
            t !== undefined &&
            typeof t === 'object' &&
            ('id' in t || 'amount' in t || 'type' in t)
        );

        if (validTransactions.length < transactions.length) {
            console.warn('发现无效交易数据，已过滤');
        }

        const filtered = [...validTransactions]
            .sort((a, b) => {
                // 安全地处理日期比较
                try {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                } catch (error) {
                    console.error('日期排序错误:', error);
                    return 0;
                }
            })
            .slice(0, limit);

        console.log('过滤后交易数量:', filtered.length);
        filtered.forEach((item, index) => {
            console.log(`交易${index + 1}:`, {
                id: item.id,
                type: item.type,
                amount: item.amount,
                date: item.date,
                category: item.category_name
            });
        });

        return filtered;
    }, [transactions, limit]);

    console.log('过滤后的交易数据:', filteredTransactions);

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
                    {filteredTransactions.map((transaction, index) => {
                        // 添加调试输出
                        console.log('渲染交易项:', index, transaction?.id);

                        return (
                            <Card key={transaction?.id || `trans-${index}`} className="bg-content1/50">
                                <CardBody className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${transaction?.type === 'income' ? 'bg-success/10' : 'bg-danger/10'
                                            }`}>
                                            {transaction?.type === 'income' ? (
                                                <ArrowUpRight size={20} className="text-success" />
                                            ) : (
                                                <ArrowDownRight size={20} className="text-danger" />
                                            )}
                                        </div>

                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{transaction?.category_name || '未分类'}</p>
                                                    <p className="text-xs text-default-500">
                                                        {formatDate(transaction?.date || new Date())}
                                                        {!isPersonalMode && transaction?.user_id && (
                                                            <span className={`ml-2 ${isCurrentUserTransaction(transaction) ? 'text-primary font-medium' : 'text-default-500'}`}>
                                                                {transaction?.username || `用户${transaction?.user_id}`}
                                                                {isCurrentUserTransaction(transaction) && ' (我)'}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-semibold ${transaction?.type === 'income' ? 'text-success' : 'text-danger'
                                                        }`}>
                                                        {transaction?.type === 'income' ? '+' : '-'}
                                                        {formatCurrency(transaction?.amount)}
                                                    </p>
                                                    {transaction?.description && (
                                                        <p className="text-xs text-default-500">{transaction?.description}</p>
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
                                                onPress={() => onDelete && transaction?.id && onDelete(transaction.id)}
                                                className="text-danger"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}

                    {onViewMore && transactions.length > limit && (
                        <Button
                            className="w-full mt-2"
                            variant="flat"
                            color="primary"
                            onPress={onViewMore}
                        >
                            查看更多交易记录
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecentTransactions; 