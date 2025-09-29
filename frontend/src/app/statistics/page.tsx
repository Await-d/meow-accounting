/*
 * @Author: Await
 * @Date: 2025-03-10 19:45:48
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 20:23:19
 * @Description: 请填写简介
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { Statistics } from '@/components';
import CategoryStats from '@/components/CategoryStats';
import { TimeRange } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

export default function StatisticsPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    return (
        <PageLayout
            title={currentRoute?.name || '统计分析'}
            description="浏览收支趋势与分类分布，快速洞察家庭财务健康状况。"
            backgroundVariant="minimal"
        >
            <Card className="border border-default-100 bg-background/60 backdrop-blur-md">
                <CardBody className="space-y-8">
                    <Statistics />
                    <CategoryStats
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                    />
                </CardBody>
            </Card>
        </PageLayout>
    );
}
