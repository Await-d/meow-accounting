'use client';

import { useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { TransactionList } from '@/components';

export default function TransactionsPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">
                        {currentRoute?.name || '交易记录'}
                    </h1>
                </CardHeader>
                <CardBody>
                    <TransactionList />
                </CardBody>
            </Card>
        </div>
    );
} 