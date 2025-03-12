"use client";

import React from 'react';
import { Card, CardBody, Tab, Tabs } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getAllRoutes } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { columns } from './columns';

export default function RoutesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const { data: routesData, isLoading } = useQuery({
        queryKey: ['routes', 'all'],
        queryFn: getAllRoutes,
        enabled: isAdmin
    });

    const personalColumns = [
        ...columns,
        {
            header: '创建者',
            accessorKey: 'user.username',
        }
    ];

    const familyColumns = [
        ...columns,
        {
            header: '所属家庭',
            accessorKey: 'family.name',
        },
        {
            header: '创建者',
            accessorKey: 'user.username',
        }
    ];

    if (!isAdmin) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">无权访问</h2>
                <p>只有管理员可以访问此页面</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">路由管理</h2>
            </div>

            <Tabs aria-label="路由类型">
                <Tab key="personal" title="个人路由">
                    <Card>
                        <CardBody>
                            <DataTable
                                columns={personalColumns}
                                data={routesData?.personalRoutes || []}
                                isLoading={isLoading}
                                pagination
                            />
                        </CardBody>
                    </Card>
                </Tab>
                <Tab key="family" title="家庭路由">
                    <Card>
                        <CardBody>
                            <DataTable
                                columns={familyColumns}
                                data={routesData?.familyRoutes || []}
                                isLoading={isLoading}
                                pagination
                            />
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
} 