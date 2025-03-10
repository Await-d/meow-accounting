'use client';

import { useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';

export default function CustomPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">
                        {currentRoute?.name || '自定义页面'}
                    </h1>
                </CardHeader>
                <CardBody>
                    <p>这是一个自定义页面，您可以根据需要进行定制。</p>
                </CardBody>
            </Card>
        </div>
    );
} 