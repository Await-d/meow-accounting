/*
 * @Author: Await
 * @Date: 2025-03-10 19:42:20
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 19:43:46
 * @Description: 请填写简介
 */
'use client';

import { useEffect } from 'react';
import { Card, CardBody, CardHeader, Button } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';

export default function DashboardPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">
                        {currentRoute?.name || '仪表盘'}
                    </h1>
                </CardHeader>
                <CardBody>
                    <p>欢迎回来，{user?.username}！</p>
                </CardBody>
            </Card>
        </div>
    );
} 