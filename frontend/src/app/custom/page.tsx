'use client';

import { Card, CardBody, CardHeader, Button, Chip, Divider } from '@nextui-org/react';
import { useRoute } from '@/hooks/useRoute';
import PageLayout from '@/components/PageLayout';
import { ExternalLink, Settings, Info, Clock } from 'lucide-react';
import Link from 'next/link';

export default function CustomPage() {
    const { currentRoute, userRoutes } = useRoute();

    const description = currentRoute?.path
        ? `当前路由：${currentRoute.path}`
        : '自定义页面 — 可在路由管理中配置专属页面内容';

    return (
        <PageLayout
            title={currentRoute?.name || '自定义页面'}
            description={description}
            backgroundVariant="minimal"
        >
            <div className="space-y-6">
                {currentRoute && (
                    <Card className="border border-default-100 bg-background/70 backdrop-blur">
                        <CardHeader className="flex gap-3 px-6 py-4">
                            <Info size={20} className="text-primary" />
                            <div>
                                <h3 className="text-base font-semibold">当前路由信息</h3>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="space-y-3 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-default-500">名称</span>
                                <span className="text-sm font-medium">{currentRoute.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-default-500">路径</span>
                                <code className="text-xs bg-default-100 px-2 py-1 rounded">{currentRoute.path}</code>
                            </div>
                            {currentRoute.type && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-default-500">类型</span>
                                    <Chip size="sm" variant="flat" color="primary">{currentRoute.type}</Chip>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                <Card className="border border-default-100 bg-background/70 backdrop-blur">
                    <CardHeader className="flex gap-3 px-6 py-4">
                        <Clock size={20} className="text-primary" />
                        <div>
                            <h3 className="text-base font-semibold">我的路由</h3>
                            <p className="text-xs text-default-500">已配置 {userRoutes.length} 个路由</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="px-6 py-4">
                        {userRoutes.length === 0 ? (
                            <p className="text-sm text-default-400 text-center py-4">暂无自定义路由</p>
                        ) : (
                            <div className="space-y-2">
                                {userRoutes.slice(0, 5).map((route) => (
                                    <div key={route.id} className="flex items-center justify-between py-1">
                                        <div>
                                            <span className="text-sm font-medium">{route.name}</span>
                                            <code className="ml-2 text-xs text-default-400">{route.path}</code>
                                        </div>
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={route.is_active ? 'success' : 'default'}
                                        >
                                            {route.is_active ? '启用' : '禁用'}
                                        </Chip>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                <div className="flex justify-end">
                    <Button
                        as={Link}
                        href="/settings/routes"
                        color="primary"
                        variant="flat"
                        startContent={<Settings size={16} />}
                        endContent={<ExternalLink size={14} />}
                    >
                        管理路由配置
                    </Button>
                </div>
            </div>
        </PageLayout>
    );
}
