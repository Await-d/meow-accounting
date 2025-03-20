'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Checkbox, Input, Slider, RadioGroup, Radio, Divider } from '@nextui-org/react';
import { TransactionFilter as FilterType, TransactionFilter as TransactionFilterType, Category } from '@/lib/types';
import { X, Check } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import DatePicker from '@/components/DatePicker';

// 添加简单版本的过滤器组件
export interface SimpleFilterProps {
    onFilter: (filter: FilterType) => void;
}

// 简单版本的过滤器组件
export default function SimpleTransactionFilter({ onFilter }: SimpleFilterProps) {
    const [filter, setFilter] = useState<FilterType>({});

    // 添加你需要的过滤UI元素
    return (
        <Button size="sm" onPress={() => onFilter(filter)}>
            过滤
        </Button>
    );
}

// 原有复杂版本保持不变
export interface TransactionFilterProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filter: FilterType) => void;
    initialFilter?: FilterType;
    onFilter?: React.Dispatch<React.SetStateAction<TransactionFilterType>>;
}

export function TransactionFilter({ isOpen, onClose, onApply, initialFilter = {} }: TransactionFilterProps) {
    const [filter, setFilter] = useState<FilterType>(initialFilter);
    const { categories } = useCategories();

    useEffect(() => {
        setFilter(initialFilter);
    }, [initialFilter]);

    const handleTypeChange = (types: string[]) => {
        setFilter(prev => ({ ...prev, types }));
    };

    const handleCategoryChange = (categoryIds: number[]) => {
        setFilter(prev => ({ ...prev, categoryIds }));
    };

    const handleDateRangeChange = (range: { startDate?: string; endDate?: string }) => {
        setFilter(prev => ({
            ...prev,
            startDate: range.startDate,
            endDate: range.endDate
        }));
    };

    const handleAmountRangeChange = (range: [number, number]) => {
        setFilter(prev => ({
            ...prev,
            minAmount: range[0],
            maxAmount: range[1]
        }));
    };

    const handleReset = () => {
        setFilter({});
    };

    const handleApply = () => {
        onApply(filter);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardBody className="p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">交易筛选</h3>
                    <Button isIconOnly variant="light" onPress={onClose}>
                        <X size={18} />
                    </Button>
                </div>

                <Divider className="my-3" />

                <div className="space-y-5">
                    {/* 交易类型筛选 */}
                    <div>
                        <h4 className="text-md font-medium mb-2">交易类型</h4>
                        <RadioGroup
                            value={filter.type}
                            onValueChange={(value) => setFilter(prev => ({ ...prev, type: value as 'income' | 'expense' | undefined }))}
                        >
                            <Radio value="all">全部</Radio>
                            <Radio value="income">收入</Radio>
                            <Radio value="expense">支出</Radio>
                        </RadioGroup>
                    </div>

                    {/* 金额范围筛选 */}
                    <div>
                        <h4 className="text-md font-medium mb-2">金额范围</h4>
                        <div className="flex gap-3">
                            <Input
                                type="number"
                                label="最小金额"
                                placeholder="0"
                                value={filter.minAmount?.toString() || ''}
                                onChange={(e) => setFilter(prev => ({ ...prev, minAmount: e.target.value ? Number(e.target.value) : undefined }))}
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                label="最大金额"
                                placeholder="不限"
                                value={filter.maxAmount?.toString() || ''}
                                onChange={(e) => setFilter(prev => ({ ...prev, maxAmount: e.target.value ? Number(e.target.value) : undefined }))}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* 日期范围筛选 */}
                    <div>
                        <h4 className="text-md font-medium mb-2">日期范围</h4>
                        <div className="flex gap-3">
                            <DatePicker
                                label="开始日期"
                                value={filter.startDate ? new Date(filter.startDate) : undefined}
                                onChange={(date) => setFilter(prev => ({
                                    ...prev,
                                    startDate: date ? date.toISOString().split('T')[0] : undefined
                                }))}
                                className="flex-1"
                            />
                            <DatePicker
                                label="结束日期"
                                value={filter.endDate ? new Date(filter.endDate) : undefined}
                                onChange={(date) => setFilter(prev => ({
                                    ...prev,
                                    endDate: date ? date.toISOString().split('T')[0] : undefined
                                }))}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* 分类筛选 */}
                    {categories && categories.length > 0 && (
                        <div>
                            <h4 className="text-md font-medium mb-2">分类</h4>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category: Category) => (
                                    <Checkbox
                                        key={category.id}
                                        isSelected={filter.categoryIds?.includes(Number(category.id))}
                                        onValueChange={(isSelected) => {
                                            setFilter(prev => {
                                                const categoryIds = prev.categoryIds || [];
                                                if (isSelected) {
                                                    return { ...prev, categoryIds: [...categoryIds, Number(category.id)] };
                                                } else {
                                                    return { ...prev, categoryIds: categoryIds.filter(id => id !== Number(category.id)) };
                                                }
                                            });
                                        }}
                                    >
                                        {category.name}
                                    </Checkbox>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <Divider className="my-4" />

                <div className="flex justify-between gap-2">
                    <Button variant="flat" color="danger" onPress={handleReset} className="flex-1">
                        重置
                    </Button>
                    <Button color="primary" onPress={handleApply} className="flex-1">
                        应用筛选
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}
