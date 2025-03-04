'use client';

import { useCallback, useState, useRef, useMemo } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Spinner,
    Button,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@nextui-org/react';
import { ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import { useTransactions, type Transaction } from '@/lib/api';
import { useToast } from './Toast';
import Skeleton from './Skeleton';
import TransactionForm from './TransactionForm';

export default function TransactionList() {
    const [page, setPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

    // 处理编辑
    const handleEdit = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        onEditOpen();
    };

    // 处理删除
    const handleDelete = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        onDeleteOpen();
    };

    // 确认删除
    const confirmDelete = async () => {
        if (!selectedTransaction) return;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/transactions/${selectedTransaction.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                showToast('删除成功', 'success');
                refetch();
            } else {
                showToast('删除失败', 'error');
            }
        } catch (error) {
            showToast('删除失败', 'error');
        } finally {
            onDeleteClose();
            setSelectedTransaction(null);
        }
    };

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
                        <TableColumn>操作</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={transactions}
                    >
                        {transactions.slice(
                            rowVirtualizer.getVirtualItems()[0]?.index || 0,
                            (rowVirtualizer.getVirtualItems().slice(-1)[0]?.index || 0) + 1
                        ).map((transaction) => (
                            <TableRow key={transaction.id}>
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
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleEdit(transaction)}
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => handleDelete(transaction)}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <Spinner size="sm" />
                    </div>
                )}
            </div>

            {/* 删除确认对话框 */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <ModalContent>
                    <ModalHeader>确认删除</ModalHeader>
                    <ModalBody>
                        确定要删除这条交易记录吗？此操作无法撤销。
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onDeleteClose}>
                            取消
                        </Button>
                        <Button color="danger" onPress={confirmDelete}>
                            删除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 编辑表单 */}
            <TransactionForm
                isOpen={isEditOpen}
                onClose={() => {
                    onEditClose();
                    setSelectedTransaction(null);
                }}
                transaction={selectedTransaction}
            />
        </div>
    );
}