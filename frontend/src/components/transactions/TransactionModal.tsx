import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    Textarea,
    Chip,
    Avatar
} from '@nextui-org/react';
import { Calendar, DollarSign, Tag, FileText, ChevronDown } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Category, Transaction, TransactionType } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import dayjs from 'dayjs';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transaction?: Transaction;
    type?: TransactionType;
    familyId?: string;
}

// 扩展的交易表单数据类型，添加UI中需要的字段
interface TransactionFormData {
    type: TransactionType;
    amount: number;
    date: Date | string;
    note?: string;
    categoryId?: string;
    familyId?: string | number;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    transaction,
    type = 'expense',
    familyId
}) => {
    // 使用useRef缓存稳定的初始状态，避免重复创建引用
    const initialFormState = useRef<TransactionFormData>({
        type,
        amount: 0,
        date: new Date(),
        note: '',
        categoryId: '',
        familyId: familyId || undefined
    }).current;

    // 创建一个简易的toast函数
    const toast = useCallback((message: { title: string; variant?: string }) => {
        console.log(message.title);
        // 这里可以集成实际的toast系统
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>(initialFormState);

    // Declare the mutation hooks
    const { mutate: createTransaction } = useCreateTransaction();
    const { mutate: updateTransaction } = useUpdateTransaction();

    // 稳定化familyId引用，避免不必要的API调用
    const stableFamilyId = useMemo(() => familyId, [familyId]);

    // 获取所需数据，确保避免循环依赖
    const { categories } = useCategories();

    // 根据交易类型筛选分类
    const filteredCategories = useMemo(() => {
        return categories?.filter(c => c.type === formData.type) || [];
    }, [categories, formData.type]);

    // 用于跟踪是否已设置初始数据
    const hasSetInitialData = useRef(false);

    // 当弹窗关闭时，重置表单状态
    useEffect(() => {
        if (!isOpen) {
            hasSetInitialData.current = false;
            return;
        }

        if (!hasSetInitialData.current) {
            if (transaction) {
                setFormData({
                    type: transaction.type as TransactionType,
                    amount: parseFloat(transaction.amount.toString()),
                    date: dayjs(transaction.date).toDate(),
                    note: transaction.description || '',
                    categoryId: transaction.category_id?.toString() || '',
                    familyId: familyId || undefined
                });
            } else {
                // 新建交易的情况
                setFormData({
                    type: type || 'expense',
                    amount: 0,
                    date: new Date(),
                    note: '',
                    categoryId: '',
                    familyId: familyId || undefined
                });
            }
            hasSetInitialData.current = true;
        }
    }, [isOpen, transaction, type, familyId]);

    const handleInputChange = useCallback((field: string, value: any) => {
        setFormData((prev: TransactionFormData) => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            // 验证必填字段
            if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
                toast({
                    title: '请输入有效的金额',
                    variant: 'destructive'
                });
                return;
            }

            if (!formData.categoryId) {
                toast({
                    title: '请选择分类',
                    variant: 'destructive'
                });
                return;
            }

            const data = {
                type: formData.type,
                amount: Number(formData.amount),
                category_id: Number(formData.categoryId),
                date: typeof formData.date === 'string' ? formData.date : format(formData.date, 'yyyy-MM-dd'),
                description: formData.note || '',
                family_id: formData.familyId ? Number(formData.familyId) : undefined
            };

            if (transaction?.id) {
                updateTransaction({
                    ...transaction,
                    ...data
                });
                toast({
                    title: '交易已更新',
                    variant: 'success'
                });
            } else {
                createTransaction(data);
                toast({
                    title: '交易已创建',
                    variant: 'success'
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('交易保存失败', error);
            toast({
                title: '保存失败',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getTypeColor = useCallback((transactionType: TransactionType) => {
        switch (transactionType) {
            case 'income':
                return 'success';
            case 'expense':
                return 'danger';
            default:
                return 'default';
        }
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                {transaction?.id ? '编辑交易' : '新增交易'}
                                <Chip
                                    color={getTypeColor(formData.type as TransactionType)}
                                    variant="flat"
                                    radius="sm"
                                    size="sm"
                                >
                                    {formData.type === 'income' ? '收入' : '支出'}
                                </Chip>
                            </div>
                        </ModalHeader>
                        <ModalBody className="space-y-4">
                            <div className="flex gap-3">
                                <Button
                                    className={`flex-1 ${formData.type === 'expense' ? 'bg-danger text-white' : 'bg-default-100'}`}
                                    onPress={() => handleInputChange('type', 'expense')}
                                >
                                    支出
                                </Button>
                                <Button
                                    className={`flex-1 ${formData.type === 'income' ? 'bg-success text-white' : 'bg-default-100'}`}
                                    onPress={() => handleInputChange('type', 'income')}
                                >
                                    收入
                                </Button>
                            </div>

                            <Input
                                type="number"
                                label="金额"
                                placeholder="0.00"
                                startContent={<DollarSign size={16} />}
                                value={formData.amount?.toString() || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                            />

                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <DatePicker
                                        date={formData.date as Date}
                                        setDate={(date) => handleInputChange('date', date)}
                                    />
                                </div>
                            </div>

                            <Select
                                label="分类"
                                placeholder="选择分类"
                                selectedKeys={formData.categoryId ? [formData.categoryId] : []}
                                startContent={<Tag size={16} />}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('categoryId', e.target.value)}
                            >
                                {filteredCategories.map((category: Category) => (
                                    <SelectItem
                                        key={category.id.toString()}
                                        value={category.id.toString()}
                                    >
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Textarea
                                label="备注"
                                placeholder="添加备注信息"
                                startContent={<FileText size={16} />}
                                value={formData.note || ''}
                                onChange={(e) => handleInputChange('note', e.target.value)}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose}>
                                取消
                            </Button>
                            <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                                保存
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default TransactionModal; 