'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Breadcrumbs, BreadcrumbItem, Spinner } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { TransactionForm } from '@/components';
import { ArrowLeft } from 'lucide-react';
import { useUpdateTransaction } from '@/hooks/useTransactions';
import { useQuery } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import { Transaction } from '@/lib/types';

interface EditTransactionPageProps {
    params: {
        id: string;
    };
}

export default function EditTransactionPage({ params }: EditTransactionPageProps) {
    const { id } = params;
    const { user } = useAuth();
    const router = useRouter();
    const { data: transactionResponse, isLoading } = useQuery({
        queryKey: ['transaction', id],
        queryFn: () => fetchAPI<Transaction>(`/transactions/${id}`)
    });

    const transaction = (transactionResponse as any)?.data;
    const [error, setError] = useState<string | null>(null);

    // 处理返回
    const handleBack = () => {
        router.back();
    };

    // 如果交易不存在或不属于当前用户，重定向到交易列表
    useEffect(() => {
        if (!isLoading && !transaction) {
            router.push('/transactions');
        }
    }, [isLoading, transaction, router]);

    return (
        <PageLayout
            title="编辑交易"
            description="更新已有交易的详情信息。"
            backgroundVariant="minimal"
        >
            <div className="space-y-6">
                <Breadcrumbs>
                    <BreadcrumbItem onClick={() => router.push('/dashboard')}>仪表盘</BreadcrumbItem>
                    <BreadcrumbItem onClick={() => router.push('/transactions')}>交易记录</BreadcrumbItem>
                    <BreadcrumbItem>编辑交易</BreadcrumbItem>
                </Breadcrumbs>

                <Card className="border border-default-100 bg-background/70 backdrop-blur">
                    <CardHeader className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button isIconOnly variant="light" onClick={handleBack}>
                                <ArrowLeft size={20} />
                            </Button>
                            <h1 className="text-2xl font-bold">编辑交易</h1>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spinner />
                            </div>
                        ) : transaction ? (
                            <>
                                {error && (
                                    <div className="bg-danger-50 text-danger p-3 rounded-lg mb-4">
                                        {error}
                                    </div>
                                )}
                                <TransactionForm
                                    isOpen={true}
                                    onClose={() => router.push('/transactions')}
                                    transaction={transaction}
                                />
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-default-500">交易不存在或您没有权限编辑</p>
                                <Button
                                    color="primary"
                                    variant="flat"
                                    className="mt-4"
                                    onClick={() => router.push('/transactions')}
                                >
                                    返回交易列表
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </PageLayout>
    );
} 