/*
 * @Author: Await
 * @Date: 2025-03-10 19:45:48
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 20:23:19
 * @Description: 请填写简介
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { Statistics, CategoryStats } from '@/components';
import { TimeRange } from '@/lib/types';

export default function StatisticsPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">
                        {currentRoute?.name || '统计分析'}
                    </h1>
                </CardHeader>
                <CardBody>
                    <div className="space-y-8">
                        <Statistics />
                        <CategoryStats
                            timeRange={timeRange}
                            onTimeRangeChange={setTimeRange}
                        />
                    </div>
                </CardBody>
            </Card>
        </div>
    );
} 