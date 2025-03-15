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
import { Calendar, DollarSign, Tag, FileText, User, ChevronDown } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Category, Transaction, TransactionType, Account, Member } from '@/lib/types';
import { useCategories, useAccounts, useMembers, createTransaction, updateTransaction } from '@/lib/api';
import { format } from 'date-fns';

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
    accountId?: string;
    memberId?: string;
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
        accountId: '',
        memberId: '',
        familyId: familyId || undefined
    }).current;

    // 创建一个简易的toast函数
    const toast = useCallback((message: { title: string; variant?: string }) => {
        console.log(message.title);
        // 这里可以集成实际的toast系统
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TransactionFormData>(initialFormState);

    // 稳定化familyId引用，避免不必要的API调用
    const stableFamilyId = useMemo(() => familyId, [familyId]);

    // 获取所需数据，确保避免循环依赖
    const { categories } = useCategories();
    const { accounts } = useAccounts();
    const { members } = useMembers(stableFamilyId);

    // 根据交易类型筛选分类
    const filteredCategories = useMemo(() => {
        return categories?.filter(c => c.type === formData.type) || [];
    }, [categories, formData.type]);

    // 当transaction变更时，更新表单数据，只运行一次的逻辑
    const hasSetInitialData = useRef(false);
    useEffect(() => {
        // 如果弹窗未打开，不处理表单数据
        if (!isOpen) {
            hasSetInitialData.current = false;
            return;
        }

        // 只在弹窗打开且尚未设置初始数据时设置
        if (!hasSetInitialData.current) {
            if (transaction) {
                setFormData({
                    ...transaction,
                    date: transaction.date ? new Date(transaction.date) : new Date()
                });
            } else {
                setFormData({
                    type: type || 'expense',
                    amount: 0,
                    date: new Date(),
                    note: '',
                    categoryId: '',
                    accountId: '',
                    memberId: '',
                    familyId: familyId || undefined
                });
            }
            hasSetInitialData.current = true;
        }
    }, [isOpen, transaction, type, familyId]);

    const handleInputChange = useCallback((field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            setIsLoading(true);

            if (!formData.amount || formData.amount <= 0) {
                toast({
                    title: '请输入有效金额',
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

            if (!formData.accountId) {
                toast({
                    title: '请选择账户',
                    variant: 'destructive'
                });
                return;
            }

            const data = {
                ...formData,
                date: format(formData.date as Date, 'yyyy-MM-dd')
            };

            if (transaction?.id) {
                await updateTransaction(transaction.id, data as Transaction);
                toast({
                    title: '交易已更新',
                    variant: 'success'
                });
            } else {
                await createTransaction(data as Transaction);
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
    }, [formData, transaction, toast, onSuccess, onClose]);

    const getTypeColor = useCallback((transactionType: TransactionType) => {
        switch (transactionType) {
            case 'income':
                return 'success';
            case 'expense':
                return 'danger';
            case 'transfer':
                return 'primary';
            default:
                return 'default';
        }
    }, []);

    // 当弹窗关闭时，重置表单状态
    useEffect(() => {
        if (!isOpen) {
            hasSetInitialData.current = false;
        }
    }, [isOpen]);

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
                                    {formData.type === 'income' ? '收入' : formData.type === 'expense' ? '支出' : '转账'}
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
                                <Button
                                    className={`flex-1 ${formData.type === 'transfer' ? 'bg-primary text-white' : 'bg-default-100'}`}
                                    onPress={() => handleInputChange('type', 'transfer')}
                                >
                                    转账
                                </Button>
                            </div>

                            <Input
                                type="number"
                                label="金额"
                                placeholder="0.00"
                                startContent={<DollarSign size={16} />}
                                value={formData.amount?.toString() || ''}
                                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
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
                                startContent={<Tag size={16} />}
                                selectedKeys={formData.categoryId ? [formData.categoryId.toString()] : []}
                                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                            >
                                {filteredCategories.map((category: Category) => (
                                    <SelectItem key={category.id.toString()} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="账户"
                                placeholder="选择账户"
                                startContent={<DollarSign size={16} />}
                                selectedKeys={formData.accountId ? [formData.accountId.toString()] : []}
                                onChange={(e) => handleInputChange('accountId', e.target.value)}
                            >
                                {accounts?.map((account: Account) => (
                                    <SelectItem key={account.id.toString()} value={account.id.toString()}>
                                        {account.name}
                                    </SelectItem>
                                ))}
                            </Select>

                            {familyId && members && members.length > 0 && (
                                <Select
                                    label="成员"
                                    placeholder="选择家庭成员"
                                    startContent={<User size={16} />}
                                    selectedKeys={formData.memberId ? [formData.memberId.toString()] : []}
                                    onChange={(e) => handleInputChange('memberId', e.target.value)}
                                >
                                    {members.map((member: Member) => (
                                        <SelectItem
                                            key={member.id.toString()}
                                            value={member.id.toString()}
                                            startContent={
                                                <Avatar
                                                    name={member.name.charAt(0)}
                                                    size="sm"
                                                    radius="full"
                                                    className="mr-2"
                                                />
                                            }
                                        >
                                            {member.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                            )}

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