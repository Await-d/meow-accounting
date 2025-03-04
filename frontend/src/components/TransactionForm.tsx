'use client';

import { useEffect, useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea
} from '@nextui-org/react';
import dayjs from 'dayjs';
import { useCategories, useCreateTransaction, type Transaction } from '@/lib/api';
import { useToast } from './Toast';

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    transaction?: Transaction | null;
}

export default function TransactionForm({ isOpen, onClose, transaction }: TransactionFormProps) {
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
    const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
    const { showToast } = useToast();
    const createTransaction = useCreateTransaction();

    // 当编辑模式下，填充表单数据
    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmount(transaction.amount.toString());
            setCategoryId(transaction.category_id.toString());
            setDescription(transaction.description || '');
            setDate(transaction.date);
        }
    }, [transaction]);

    // 重置表单
    const resetForm = () => {
        setType('expense');
        setAmount('');
        setCategoryId('');
        setDescription('');
        setDate(dayjs().format('YYYY-MM-DD'));
    };

    const handleSubmit = async () => {
        if (!amount || !categoryId) {
            showToast('请填写金额和选择分类', 'error');
            return;
        }

        try {
            if (transaction) {
                // 编辑模式
                const response = await fetch(`http://localhost:3001/api/transactions/${transaction.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type,
                        amount: parseFloat(amount),
                        category_id: parseInt(categoryId),
                        description,
                        date,
                    }),
                });

                if (response.ok) {
                    showToast('修改成功', 'success');
                    onClose();
                } else {
                    showToast('修改失败', 'error');
                }
            } else {
                // 创建模式
                await createTransaction.mutateAsync({
                    type,
                    amount: parseFloat(amount),
                    category_id: parseInt(categoryId),
                    description,
                    date,
                });
                showToast('添加成功', 'success');
                onClose();
            }
        } catch (error) {
            showToast('操作失败', 'error');
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const filteredCategories = categories.filter(category => category.type === type);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalContent>
                <ModalHeader>{transaction ? '编辑交易' : '新增交易'}</ModalHeader>
                <ModalBody className="gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="类型"
                            selectedKeys={[type]}
                            onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                        >
                            <SelectItem key="expense" value="expense">支出</SelectItem>
                            <SelectItem key="income" value="income">收入</SelectItem>
                        </Select>

                        <Input
                            type="number"
                            label="金额"
                            value={amount}
                            onValueChange={setAmount}
                        />

                        <Select
                            label="分类"
                            selectedKeys={categoryId ? [categoryId] : []}
                            onChange={(e) => setCategoryId(e.target.value)}
                            isLoading={isLoadingCategories}
                        >
                            {filteredCategories.map((category) => (
                                <SelectItem key={category.id.toString()} value={category.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <span>{category.icon}</span>
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
                        />

                        <Textarea
                            label="描述"
                            value={description}
                            onValueChange={setDescription}
                            className="col-span-2"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={handleClose}>
                        取消
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={createTransaction.isPending}>
                        保存
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 