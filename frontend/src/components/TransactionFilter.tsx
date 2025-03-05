'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from '@nextui-org/react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { useCategories } from '@/lib/api';

export interface TransactionFilterValues {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    categoryId?: number;
    minAmount?: number;
    maxAmount?: number;
}

interface TransactionFilterProps {
    onFilter: (values: TransactionFilterValues) => void;
}

export default function TransactionFilter({ onFilter }: TransactionFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState<'income' | 'expense'>();
    const [categoryId, setCategoryId] = useState<string>();
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    const { data: categories = [] } = useCategories();
    const filteredCategories = type ? categories.filter(cat => cat.type === type) : categories;

    const handleFilter = () => {
        onFilter({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            type,
            categoryId: categoryId ? parseInt(categoryId) : undefined,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        });
        setIsOpen(false);
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setType(undefined);
        setCategoryId(undefined);
        setMinAmount('');
        setMaxAmount('');
        onFilter({});
        setIsOpen(false);
    };

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>
                <Button
                    variant="flat"
                    startContent={<FunnelIcon className="h-4 w-4" />}
                >
                    筛选
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="date"
                            label="开始日期"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="结束日期"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <Select
                        label="类型"
                        selectedKeys={type ? new Set([type]) : new Set()}
                        onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                    >
                        <SelectItem key="income" value="income">收入</SelectItem>
                        <SelectItem key="expense" value="expense">支出</SelectItem>
                    </Select>

                    <Select
                        label="分类"
                        selectedKeys={categoryId ? new Set([categoryId]) : new Set()}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        {filteredCategories.map((category) => (
                            <SelectItem
                                key={category.id.toString()}
                                value={category.id.toString()}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </Select>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            label="最小金额"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                        />
                        <Input
                            type="number"
                            label="最大金额"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="light"
                            onPress={handleReset}
                        >
                            重置
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleFilter}
                        >
                            应用
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
} 