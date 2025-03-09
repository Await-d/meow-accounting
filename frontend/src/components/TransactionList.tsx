'use client';

import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
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
    ButtonGroup,
    Input,
} from '@nextui-org/react';
import { ArrowPathIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useVirtualizer } from '@tanstack/react-virtual';
import dayjs from 'dayjs';
import { useTransactions, useDeleteTransaction, type Transaction, type TransactionFilter } from '@/lib/api';
import { useToast } from './Toast';
import { useAuth } from '@/hooks/useAuth';
import Skeleton from './Skeleton';
import TransactionForm from './TransactionForm';
import { default as TransactionFilterComponent } from './TransactionFilter';
import TransactionImport from './TransactionImport';
import TransactionExport from './TransactionExport';
import { CreditCardIcon } from '@heroicons/react/24/outline';

export default function TransactionList() {
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<TransactionFilter>({});
    const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useTransactions(filter);
    const { mutate: deleteTransaction } = useDeleteTransaction();
    const { user, isGuest, enterGuestMode, exitGuestMode } = useAuth();
    const { showToast } = useToast();
    const { isOpen: isGuestOpen, onOpen: onGuestOpen, onClose: onGuestClose } = useDisclosure();
    const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
    const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
    const [guestPassword, setGuestPassword] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const parentRef = useRef<HTMLDivElement>(null);

    const transactions = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.items || []);
    }, [data]);

    const virtualizer = useVirtualizer({
        count: transactions.length + (hasNextPage ? 1 : 0),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70,
        overscan: 10,
    });

    const handleScroll = useCallback(() => {
        const { scrollTop, scrollHeight, clientHeight } = parentRef.current || {};
        if (!scrollTop || !scrollHeight || !clientHeight) return;

        const isCloseToBottom = scrollTop + clientHeight >= scrollHeight - 300;
        if (isCloseToBottom && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        const scrollElement = parentRef.current;
        if (!scrollElement) return;

        scrollElement.addEventListener('scroll', handleScroll);
        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleEdit = (transaction: Transaction) => {
        if (isGuest) {
            showToast('访客模式下无法编辑', 'error');
            return;
        }
        setSelectedTransaction(transaction);
        setIsEditOpen(true);
    };

    const handleDelete = (transaction: Transaction) => {
        if (isGuest) {
            showToast('访客模式下无法删除', 'error');
            return;
        }
        setSelectedTransaction(transaction);
        setIsDeleteOpen(true);
    };

    const handleGuestMode = async () => {
        try {
            await enterGuestMode(guestPassword);
            onGuestClose();
            setGuestPassword('');
            showToast('已进入访客模式', 'success');
        } catch (error) {
            showToast('访客密码错误', 'error');
        }
    };

    const handleDeleteConfirm = () => {
        if (selectedTransaction) {
            deleteTransaction(selectedTransaction.id);
        }
        setIsDeleteOpen(false);
        setSelectedTransaction(null);
    };

    const formatAmount = (amount: number, type: 'income' | 'expense') => {
        if (isGuest) {
            return '****';
        }
        return `${type === 'expense' ? '-' : '+'}${amount.toFixed(2)}`;
    };

    if (isLoading) {
        return <Skeleton type="transaction" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center sticky top-0 bg-background/70 backdrop-blur-lg z-10 py-2 px-4">
                <div className="flex items-center gap-2">
                    <TransactionFilterComponent onFilter={setFilter} />
                    {user?.privacy_mode && (
                        <Button
                            size="sm"
                            variant="flat"
                            startContent={isGuest ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            onPress={isGuest ? () => exitGuestMode() : onGuestOpen}
                        >
                            {isGuest ? '退出访客模式' : '访客模式'}
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<ArrowUpTrayIcon className="h-4 w-4" />}
                        onPress={onImportOpen}
                        isDisabled={isGuest}
                    >
                        导入
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
                        onPress={onExportOpen}
                        isDisabled={isGuest}
                    >
                        导出
                    </Button>
                </div>
            </div>

            <div
                ref={parentRef}
                className="h-[calc(100vh-350px)] md:h-[calc(100vh-230px)] overflow-auto px-4"
            >
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="bg-default-100 rounded-full p-6 mb-4">
                            <CreditCardIcon className="h-10 w-10 text-default-400" />
                        </div>
                        <p className="text-default-500">暂无交易记录</p>
                        <Button
                            color="primary"
                            variant="flat"
                            className="mt-4"
                            startContent={<PlusIcon className="h-4 w-4" />}
                            onPress={() => setIsEditOpen(true)}
                            isDisabled={isGuest}
                        >
                            添加交易
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 pb-4">
                        {transactions.map((transaction, index) => {
                            const date = dayjs(transaction.date).format('YYYY-MM-DD');
                            const showHeader =
                                index === 0 ||
                                date !== dayjs(transactions[index - 1].date).format('YYYY-MM-DD');

                            return (
                                <React.Fragment key={transaction.id}>
                                    {showHeader && (
                                        <div className="sticky top-0 bg-background/80 backdrop-blur-md py-2 px-1 text-sm font-medium border-b z-10 mt-2 first:mt-0">
                                            {date === dayjs().format('YYYY-MM-DD')
                                                ? '今天'
                                                : date === dayjs().subtract(1, 'day').format('YYYY-MM-DD')
                                                    ? '昨天'
                                                    : dayjs(date).format('MM月DD日 ddd')}
                                        </div>
                                    )}
                                    <div
                                        className="p-3 rounded-lg hover:bg-default-100 transition-colors cursor-pointer flex justify-between items-center border-b border-default-100"
                                        onClick={() => handleEdit(transaction)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${transaction.type === 'expense'
                                                ? 'bg-danger/10 text-danger'
                                                : 'bg-success/10 text-success'
                                                }`}>
                                                <span className="text-xl">{transaction.category_icon}</span>
                                            </div>
                                            <div>
                                                <div className="font-medium">{transaction.category_name}</div>
                                                <div className="text-xs text-default-400">
                                                    {transaction.description || '无描述'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={`font-semibold ${transaction.type === 'expense' ? 'text-danger' : 'text-success'
                                                }`}>
                                                {formatAmount(transaction.amount, transaction.type)}
                                            </div>
                                            <div className="flex gap-1 mt-1">
                                                <span onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => handleEdit(transaction)}
                                                        className="h-6 w-6 min-w-0"
                                                        isDisabled={isGuest}
                                                    >
                                                        <PencilIcon className="h-3 w-3" />
                                                    </Button>
                                                </span>
                                                <span onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        color="danger"
                                                        variant="light"
                                                        onPress={() => handleDelete(transaction)}
                                                        className="h-6 w-6 min-w-0"
                                                        isDisabled={isGuest}
                                                    >
                                                        <TrashIcon className="h-3 w-3" />
                                                    </Button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        {hasNextPage && (
                            <div className="py-4 flex justify-center">
                                <Button
                                    variant="flat"
                                    size="sm"
                                    color="primary"
                                    onPress={() => fetchNextPage()}
                                    isLoading={isFetchingNextPage}
                                >
                                    加载更多
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 访客模式密码输入模态框 */}
            <Modal isOpen={isGuestOpen} onClose={onGuestClose}>
                <ModalContent>
                    <ModalHeader>访客模式</ModalHeader>
                    <ModalBody>
                        <Input
                            type="password"
                            label="访客密码"
                            placeholder="请输入访客密码"
                            value={guestPassword}
                            onChange={(e) => setGuestPassword(e.target.value)}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={onGuestClose}>
                            取消
                        </Button>
                        <Button color="primary" onPress={handleGuestMode}>
                            确认
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 导入模态框 */}
            <TransactionImport isOpen={isImportOpen} onClose={onImportClose} />

            {/* 导出模态框 */}
            <TransactionExport isOpen={isExportOpen} onClose={onExportClose} />

            {/* 编辑模态框 */}
            <TransactionForm
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                transaction={selectedTransaction}
            />

            {/* 删除确认框 */}
            <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
                <ModalContent>
                    <ModalHeader>确认删除</ModalHeader>
                    <ModalBody>
                        确定要删除这条交易记录吗？
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={() => setIsDeleteOpen(false)}>
                            取消
                        </Button>
                        <Button color="danger" onPress={handleDeleteConfirm}>
                            删除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}