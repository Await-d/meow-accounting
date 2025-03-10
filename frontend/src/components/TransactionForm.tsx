'use client';

import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem } from "@nextui-org/react";
import { useCategories, useCreateTransaction, useUpdateTransaction } from '@/lib/api';
import type { Transaction, CreateTransactionData } from '@/lib/types';
import { useToast } from './Toast';
import { useState, useEffect } from 'react';

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction | null;
}

const TransactionForm = ({ isOpen, onClose, transaction }: TransactionFormProps) => {
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { categories = [], isLoading: isLoadingCategories } = useCategories();
    const { showToast } = useToast();
    const createTransaction = useCreateTransaction();
    const updateTransaction = useUpdateTransaction();

    const filteredCategories = categories.filter(cat => cat.type === transactionType);

    // 当编辑模式下，填充表单数据
    useEffect(() => {
        if (transaction) {
            setTransactionType(transaction.type);
            setAmount(transaction.amount.toString());
            setCategoryId(transaction.category_id.toString());
            setDescription(transaction.description);
            setDate(transaction.date);
        }
    }, [transaction]);

    const resetForm = () => {
        setTransactionType('expense');
        setAmount('');
        setCategoryId('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !categoryId || !description || !date) {
            showToast('请填写所有必填字段', 'error');
            return;
        }

        const selectedCategory = categories.find(cat => cat.id.toString() === categoryId);
        if (!selectedCategory) {
            showToast('请选择有效的分类', 'error');
            return;
        }

        const transactionData: CreateTransactionData = {
            type: transactionType,
            amount: Number(amount),
            category_id: Number(categoryId),
            description,
            date,
            category_name: selectedCategory.name,
            category_icon: selectedCategory.icon,
        };

        try {
            if (transaction) {
                // 编辑模式
                await updateTransaction.mutateAsync({
                    ...transactionData,
                    id: transaction.id,
                });
                showToast('修改成功', 'success');
            } else {
                // 创建模式
                await createTransaction.mutateAsync(transactionData);
                showToast('添加成功', 'success');
            }
            onClose();
            resetForm();
        } catch (error) {
            showToast('操作失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>{transaction ? '编辑交易' : '新增交易'}</ModalHeader>
                    <ModalBody className="gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="类型"
                                selectedKeys={new Set([transactionType])}
                                onChange={(e) => setTransactionType(e.target.value as 'income' | 'expense')}
                                aria-label="选择交易类型"
                            >
                                <SelectItem
                                    key="expense"
                                    value="expense"
                                    aria-label="支出"
                                >
                                    支出
                                </SelectItem>
                                <SelectItem
                                    key="income"
                                    value="income"
                                    aria-label="收入"
                                >
                                    收入
                                </SelectItem>
                            </Select>

                            <Input
                                type="number"
                                label="金额"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                aria-label="输入金额"
                            />

                            <Select
                                label="分类"
                                selectedKeys={categoryId ? new Set([categoryId]) : new Set()}
                                onChange={(e) => setCategoryId(e.target.value)}
                                isLoading={isLoadingCategories}
                                aria-label="选择交易分类"
                                errorMessage={filteredCategories.length === 0 && !isLoadingCategories ? "请先选择一个家庭并添加分类" : undefined}
                            >
                                {filteredCategories.map((category) => (
                                    <SelectItem
                                        key={category.id.toString()}
                                        value={category.id.toString()}
                                        textValue={category.name}
                                        aria-label={category.name}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span aria-hidden="true">{category.icon}</span>
                                            <span>{category.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </Select>

                            <Input
                                type="date"
                                label="日期"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                aria-label="选择日期"
                            />

                            <Input
                                className="md:col-span-2"
                                label="描述"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                aria-label="输入交易描述"
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={handleClose}>
                            取消
                        </Button>
                        <Button color="primary" type="submit">
                            {transaction ? '保存' : '添加'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default TransactionForm; 