'use client';

import { Card, CardBody } from '@nextui-org/react';
import { useRoute } from '@/hooks/useRoute';
import PageLayout from '@/components/PageLayout';

export default function CustomPage() {
    const { currentRoute } = useRoute();
    const description = currentRoute?.path
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
