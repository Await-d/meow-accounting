"use client";

import React from 'react';
import { Card, CardBody, Tab, Tabs, Button, useDisclosure } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllRoutes, createRoute, updateRoute, deleteRoute, toggleRouteActive } from '@/lib/api';
import { DataTable } from '@/components/DataTable';
import { columns } from './columns';
import { RouteForm } from './components/RouteForm';
import { RouteStats } from './components/RouteStats';
import { Route } from '@/lib/types';
import { toast } from 'sonner';
import { APIError } from '@/lib/types';

export default function RoutesPage() {
    const { user, handleUnauthorized, isLoading: authLoading } = useAuth();
    const isAdmin = user?.role === 'admin';
    const queryClient = useQueryClient();

    // 表单和统计弹窗状态
    const {
        isOpen: isFormOpen,
        onOpen: onFormOpen,
        onClose: onFormClose
    } = useDisclosure();
    const {
        isOpen: isStatsOpen,
        onOpen: onStatsOpen,
        onClose: onStatsClose
    } = useDisclosure();

    // 当前选中的路由
    const [selectedRoute, setSelectedRoute] = React.useState<Route>();

    // 获取路由数据
    const { data: routesData, isLoading } = useQuery({
        queryKey: ['routes', 'all'],
        queryFn: async () => {
            try {
                return await getAllRoutes();
            } catch (error: any) {
                // 处理错误
                if (error?.status === 401) {
                    handleUnauthorized();
                } else {
                    toast.error(`获取路由失败: ${error?.message || '未知错误'}`);
                }
                throw error;
            }
        },
        enabled: isAdmin,
    });

    // 创建路由
    const createMutation = useMutation({
        mutationFn: createRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast.success('创建成功');
            onFormClose();
        },
        onError: (error) => {
            toast.error('创建失败: ' + error.message);
        }
    });

    // 更新路由
    const updateMutation = useMutation({
        mutationFn: updateRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast.success('更新成功');
            onFormClose();
        },
        onError: (error) => {
            toast.error('更新失败: ' + error.message);
        }
    });

    // 删除路由
    const deleteMutation = useMutation({
        mutationFn: deleteRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast.success('删除成功');
        },
        onError: (error) => {
            toast.error('删除失败: ' + error.message);
        }
    });

    // 切换路由状态
    const toggleActiveMutation = useMutation({
        mutationFn: toggleRouteActive,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routes'] });
            toast.success('状态更新成功');
        },
        onError: (error) => {
            toast.error('状态更新失败: ' + error.message);
        }
    });

    // 处理表单提交
    const handleSubmit = async (data: any) => {
        if (selectedRoute) {
            await updateMutation.mutateAsync({ id: selectedRoute.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    // 处理编辑
    const handleEdit = (route: Route) => {
        setSelectedRoute(route);
        onFormOpen();
    };

    // 处理删除
    const handleDelete = async (route: Route) => {
        if (confirm('确定要删除该路由吗？')) {
            await deleteMutation.mutateAsync(route.id);
        }
    };

    // 处理状态切换
    const handleToggleActive = async (route: Route) => {
        await toggleActiveMutation.mutateAsync(route.id);
    };

    // 处理查看统计
    const handleViewStats = (route: Route) => {
        setSelectedRoute(route);
        onStatsOpen();
    };

    // 处理新增
    const handleAdd = () => {
        setSelectedRoute(undefined);
        onFormOpen();
    };

    // 添加操作列
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

    // 添加操作函数到数据
    const enhanceData = (data: Route[]) => {
        return data.map(route => ({
            ...route,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onToggleActive: handleToggleActive,
            onViewStats: handleViewStats
        }));
    };

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
                <Button
                    color="primary"
                    endContent={<Plus className="w-4 h-4" />}
                    onPress={handleAdd}
                >
                    新增路由
                </Button>
            </div>

            <Tabs aria-label="路由类型">
                <Tab key="personal" title="个人路由">
                    <Card>
                        <CardBody>
                            <DataTable
                                columns={personalColumns}
                                data={enhanceData(routesData?.personalRoutes || [])}
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
                                data={enhanceData(routesData?.familyRoutes || [])}
                                isLoading={isLoading}
                                pagination
                            />
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            <RouteForm
                isOpen={isFormOpen}
                onClose={onFormClose}
                onSubmit={handleSubmit}
                initialData={selectedRoute}
            />

            <RouteStats
                isOpen={isStatsOpen}
                onClose={onStatsClose}
                route={selectedRoute}
            />
        </div>
    );
} 