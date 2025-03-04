/*
 * @Author: Await
 * @Date: 2025-03-04 18:53:45
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 20:40:28
 * @Description: 交易记录列表组件
 */
'use client';

import { useCallback, useState, useRef, useMemo } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner, Button } from '@nextui-org/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import { useTransactions } from '@/lib/api';
import { useToast } from './Toast';
import Skeleton from './Skeleton';

export default function TransactionList() {
    const [page, setPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const {
        data,
        isLoading,
        isRefetching,
        refetch,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useTransactions();

    // 合并所有页面的交易记录
    const transactions = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.data);
    }, [data?.pages]);

    // 虚拟滚动设置
    const rowVirtualizer = useVirtualizer({
        count: transactions.length,
        getScrollElement: () => containerRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    // 下拉刷新
    const handleRefresh = async () => {
        try {
            await refetch();
            showToast('刷新成功', 'success');
        } catch (error) {
            showToast('刷新失败', 'error');
        }
    };

    // 加载更多
    const loadMore = async () => {
        if (!hasNextPage || isFetchingNextPage) return;
        try {
            await fetchNextPage();
        } catch (error) {
            showToast('加载更多失败', 'error');
        }
    };

    // 监听滚动到底部
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50 && !isFetchingNextPage && hasNextPage) {
            loadMore();
        }
    }, [isFetchingNextPage, hasNextPage, loadMore]);

    if (isLoading && !transactions.length) {
        return <Skeleton type="transaction" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center sticky top-0 bg-background/70 backdrop-blur-lg z-10 py-2">
                <h2 className="text-xl font-semibold">最近交易</h2>
                <Button
                    isIconOnly
                    variant="light"
                    onPress={handleRefresh}
                    isLoading={isRefetching}
                >
                    <ArrowPathIcon className="h-5 w-5" />
                </Button>
            </div>

            <div
                ref={containerRef}
                className="h-[calc(100vh-300px)] overflow-auto"
                onScroll={handleScroll}
            >
                <Table
                    aria-label="交易记录列表"
                    classNames={{
                        wrapper: "min-h-[200px]",
                    }}
                >
                    <TableHeader>
                        <TableColumn>日期</TableColumn>
                        <TableColumn>分类</TableColumn>
                        <TableColumn>描述</TableColumn>
                        <TableColumn>金额</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={transactions}
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems()
                            .filter(virtualRow => transactions[virtualRow.index])
                            .map((virtualRow) => {
                                const transaction = transactions[virtualRow.index];
                                return (
                                    <TableRow
                                        key={transaction.id}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <TableCell>{transaction.date ? dayjs(transaction.date).format('YYYY-MM-DD') : '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{transaction.category_icon || ''}</span>
                                                <span>{transaction.category_name || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{transaction.description || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                color={transaction.type === 'income' ? 'success' : 'danger'}
                                                variant="flat"
                                                size="sm"
                                            >
                                                <span className="font-medium">
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    ¥{(transaction.amount || 0).toFixed(2)}
                                                </span>
                                            </Chip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>

                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>
        </div>
    );
} 