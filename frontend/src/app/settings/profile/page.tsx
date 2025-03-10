'use client';

import { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    Input,
    Select,
    SelectItem,
    Divider
} from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { useToast } from '@/hooks/useToast';
import { UserSettings } from '@/lib/types';

export default function ProfilePage() {
    const { user, updateSettings } = useAuth();
    const { userRoutes, familyRoutes } = useRoute();
    const { showToast } = useToast();

    const [settings, setSettings] = useState<UserSettings>({
        privacy_mode: user?.privacy_mode || false,
        default_route: user?.default_route || '/dashboard',
        currentFamilyId: user?.currentFamilyId
    });

    // 处理设置更新
    const handleUpdate = async () => {
        try {
            await updateSettings(settings);
            showToast('设置更新成功', 'success');
        } catch (error) {
            showToast('设置更新失败', 'error');
        }
    };

    // 获取可用的路由选项
    const getRouteOptions = () => {
        const options = [
            { key: '/dashboard', label: '仪表盘' }
        ];

        // 添加个人路由
        userRoutes?.forEach(route => {
            if (route.is_active) {
                options.push({
                    key: route.path,
                    label: `个人 - ${route.name}`
                });
            }
        });

        // 添加家庭路由
        familyRoutes?.forEach(route => {
            if (route.is_active) {
                options.push({
                    key: route.path,
                    label: `家庭 - ${route.name}`
                });
            }
        });

        return options;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-bold">个人设置</h2>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                        <div className="space-y-4">
                            <Input
                                label="用户名"
                                value={user?.username || ''}
                                isReadOnly
                            />
                            <Input
                                label="邮箱"
                                value={user?.email || ''}
                                isReadOnly
                            />
                        </div>
                    </div>

                    <Divider />

                    <div>
                        <h3 className="text-lg font-semibold mb-4">偏好设置</h3>
                        <div className="space-y-4">
                            <Select
                                label="默认路由"
                                placeholder="选择默认路由"
                                selectedKeys={[settings.default_route]}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    default_route: e.target.value
                                })}
                            >
                                {getRouteOptions().map((option) => (
                                    <SelectItem key={option.key} value={option.key}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="privacy_mode"
                                    checked={settings.privacy_mode}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        privacy_mode: e.target.checked
                                    })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="privacy_mode">隐私模式</label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            color="primary"
                            onPress={handleUpdate}
                        >
                            保存设置
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
} 