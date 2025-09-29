'use client';

import { useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import PageLayout from '@/components/PageLayout';

export default function CustomPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    const description = currentRoute
        ? `当前路由：${currentRoute.path}`
        : '这是一个自定义页面，您可以根据需要配置内容。';

    return (
        <PageLayout
            title={currentRoute?.name || '自定义页面'}
            description={description}
            backgroundVariant="minimal"
        >
            <Card className="border border-default-100 bg-background/70 backdrop-blur">
                <CardBody>
                    <p>这是一个自定义页面，您可以根据需要进行定制。</p>
                </CardBody>
            </Card>
        </PageLayout>
    );
} 
