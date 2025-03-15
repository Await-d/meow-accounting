/*
 * @Author: Await
 * @Date: 2025-03-10 19:48:40
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 13:17:05
 * @Description: 请填写简介
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Select, SelectItem, Button, Switch } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { toast } from 'sonner';

export default function RouteSettings() {
    const { user, updateUser } = useAuth();
    const { userRoutes, familyRoutes } = useRoute();
    const [defaultRoute, setDefaultRoute] = useState(user?.default_route || '/dashboard');
    const [routePreload, setRoutePreload] = useState(true);

    // 合并所有可用路由
    const availableRoutes = [...userRoutes, ...familyRoutes].map(route => ({
        value: route.path,
        label: route.name
    }));

    // 保存设置
    const handleSave = async () => {
        if (!user?.id) return;

        try {
            await updateUser({
                ...user,
                id: user.id,
                default_route: defaultRoute,
                settings: {
                    ...user?.settings,
                    routePreload
                }
            });
            toast.success('路由设置已更新');
        } catch (error) {
            console.error('更新路由设置失败:', error);
            toast.error('更新路由设置失败');
        }
    };

    return (
        <Card>
            <CardBody className="gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">默认路由</label>
                    <Select
                        label="选择默认路由"
                        selectedKeys={[defaultRoute]}
                        onChange={(e) => setDefaultRoute(e.target.value)}
                    >
                        {availableRoutes.map((route) => (
                            <SelectItem key={route.value} value={route.value}>
                                {route.label}
                            </SelectItem>
                        ))}
                    </Select>
                    <p className="text-sm text-default-400">
                        登录后将自动跳转到选择的默认路由
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">路由预加载</label>
                    <Switch
                        isSelected={routePreload}
                        onValueChange={setRoutePreload}
                    >
                        启用路由预加载
                    </Switch>
                    <p className="text-sm text-default-400">
                        预加载相关路由以提升导航速度
                    </p>
                </div>

                <Button
                    color="primary"
                    onPress={handleSave}
                >
                    保存设置
                </Button>
            </CardBody>
        </Card>
    );
} 