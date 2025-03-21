/*
 * @Author: Await
 * @Date: 2025-03-14 18:36:41
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 12:51:58
 * @Description: 请填写简介
 */
'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Breadcrumbs, BreadcrumbItem } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { TransactionForm } from '@/components';
import { ArrowLeft } from 'lucide-react';
import { useCreateTransaction } from '@/lib/api';
import { Transaction } from '@/lib/types';

export default function NewTransactionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { mutate: createTransaction, isPending } = useCreateTransaction();
    const [error, setError] = useState<string | null>(null);

    // 处理返回
    const handleBack = () => {
        router.back();
    };

    // 处理提交
    const handleSubmit = (data: Omit<Transaction, 'id'>) => {
        // 确保必需字段存在
        if (!data.category_id) {
            setError('分类不能为空');
            return;
        }

        // 将数据转换为CreateTransactionData类型
        const transactionData = {
            type: data.type,
            amount: data.amount,
            category_id: data.category_id,
            description: data.description,
            date: data.date,
            category_name: data.category_name,
            category_icon: data.category_icon,
            familyId: data.familyId
        };

        createTransaction(transactionData, {
            onSuccess: () => {
                router.push('/transactions');
            },
            onError: (error) => {
                setError(error.message || '创建交易失败');
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Breadcrumbs>
                    <BreadcrumbItem onPress={() => router.push('/dashboard')}>仪表盘</BreadcrumbItem>
                    <BreadcrumbItem onPress={() => router.push('/transactions')}>交易记录</BreadcrumbItem>
                    <BreadcrumbItem>新增交易</BreadcrumbItem>
                </Breadcrumbs>
            </div>

            <Card>
                <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={handleBack}
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <h1 className="text-2xl font-bold">新增交易</h1>
                    </div>
                </CardHeader>
                <CardBody>
                    {error && (
                        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}
                    <TransactionForm
                        isOpen={true}
                        onClose={() => router.push('/transactions')}
                        transaction={null}
                    />
                </CardBody>
            </Card>
        </div>
    );
} 