'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Switch, Select, SelectItem, Divider, Slider, Tabs, Tab, Input } from '@nextui-org/react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Settings {
    theme: string;
    language: string;
    appearance: {
        fontSize: number;
        animationSpeed: number;
        density: 'comfortable' | 'compact' | 'spacious';
    };
    performance: {
        prefetch: boolean;
        cacheSize: number;
        reducedAnimations: boolean;
    };
    notifications: {
        email: boolean;
        push: boolean;
        desktop: boolean;
        summary: 'daily' | 'weekly' | 'never';
    };
}

export default function CustomSettings() {
    const { theme, setTheme } = useTheme();
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<Settings>({
        theme: theme || 'system',
        language: 'zh-CN',
        appearance: {
            fontSize: 16,
            animationSpeed: 300,
            density: 'comfortable'
        },
        performance: {
            prefetch: true,
            cacheSize: 50,
            reducedAnimations: false
        },
        notifications: {
            email: true,
            push: true,
            desktop: true,
            summary: 'daily'
        }
    });

    useEffect(() => {
        if (user?.settings?.custom) {
            const userSettings = user.settings;
            setSettings(prev => ({
                ...prev,
                ...userSettings.custom
            }));
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.id || !user?.settings) return;

        try {
            await updateUser({
                ...user,
                id: user.id,
                settings: {
                    ...user.settings,
                    custom: settings
                }
            });
            toast.success('设置已更新');
        } catch (error) {
            toast.error('更新设置失败');
        }
    };

    // 更新设置并保存
    const updateSettings = (path: string[], value: any) => {
        const newSettings = { ...settings };
        let current = newSettings;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i] as keyof typeof current] as any;
        }
        current[path[path.length - 1] as keyof typeof current] = value;
        setSettings(newSettings);
        handleSave();
    };

    return (
        <div className="space-y-6">
            <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab as any}>
                <Tab key="general" title="基本设置">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">系统设置</h3>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <div className="space-y-4">
                                <Select
                                    label="主题"
                                    value={settings.theme}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setTheme(value);
                                        updateSettings(['theme'], value);
                                    }}
                                >
                                    <SelectItem key="light" value="light">浅色</SelectItem>
                                    <SelectItem key="dark" value="dark">深色</SelectItem>
                                    <SelectItem key="system" value="system">跟随系统</SelectItem>
                                </Select>

                                <Select
                                    label="语言"
                                    value={settings.language}
                                    onChange={(e) => updateSettings(['language'], e.target.value)}
                                >
                                    <SelectItem key="zh-CN" value="zh-CN">简体中文</SelectItem>
                                    <SelectItem key="en-US" value="en-US">English</SelectItem>
                                </Select>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="appearance" title="外观设置">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">外观设置</h3>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm mb-2">字体大小: {settings.appearance.fontSize}px</p>
                                    <Slider
                                        size="sm"
                                        step={1}
                                        minValue={12}
                                        maxValue={24}
                                        value={settings.appearance.fontSize}
                                        onChange={(value) => updateSettings(['appearance', 'fontSize'], value)}
                                        className="max-w-md"
                                    />
                                </div>

                                <Divider />

                                <div>
                                    <p className="text-sm mb-2">动画速度: {settings.appearance.animationSpeed}ms</p>
                                    <Slider
                                        size="sm"
                                        step={50}
                                        minValue={0}
                                        maxValue={500}
                                        value={settings.appearance.animationSpeed}
                                        onChange={(value) => updateSettings(['appearance', 'animationSpeed'], value)}
                                        className="max-w-md"
                                    />
                                </div>

                                <Divider />

                                <Select
                                    label="布局密度"
                                    value={settings.appearance.density}
                                    onChange={(e) => updateSettings(['appearance', 'density'], e.target.value)}
                                >
                                    <SelectItem key="comfortable" value="comfortable">舒适</SelectItem>
                                    <SelectItem key="compact" value="compact">紧凑</SelectItem>
                                    <SelectItem key="spacious" value="spacious">宽松</SelectItem>
                                </Select>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="performance" title="性能设置">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">性能设置</h3>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>预加载页面</span>
                                    <Switch
                                        checked={settings.performance.prefetch}
                                        onChange={(e) => updateSettings(['performance', 'prefetch'], e.target.checked)}
                                    />
                                </div>
                                <Divider />
                                <div>
                                    <p className="text-sm mb-2">缓存大小: {settings.performance.cacheSize}MB</p>
                                    <Slider
                                        size="sm"
                                        step={10}
                                        minValue={0}
                                        maxValue={200}
                                        value={settings.performance.cacheSize}
                                        onChange={(value) => updateSettings(['performance', 'cacheSize'], value)}
                                        className="max-w-md"
                                    />
                                </div>
                                <Divider />
                                <div className="flex justify-between items-center">
                                    <span>减少动画效果</span>
                                    <Switch
                                        checked={settings.performance.reducedAnimations}
                                        onChange={(e) => updateSettings(['performance', 'reducedAnimations'], e.target.checked)}
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="notifications" title="通知设置">
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">通知设置</h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span>邮件通知</span>
                                <Switch
                                    checked={settings.notifications.email}
                                    onChange={(e) => updateSettings(['notifications', 'email'], e.target.checked)}
                                />
                            </div>
                            <Divider />
                            <div className="flex justify-between items-center">
                                <span>推送通知</span>
                                <Switch
                                    checked={settings.notifications.push}
                                    onChange={(e) => updateSettings(['notifications', 'push'], e.target.checked)}
                                />
                            </div>
                            <Divider />
                            <div className="flex justify-between items-center">
                                <span>桌面通知</span>
                                <Switch
                                    checked={settings.notifications.desktop}
                                    onChange={(e) => updateSettings(['notifications', 'desktop'], e.target.checked)}
                                />
                            </div>
                            <Divider />
                            <Select
                                label="通知摘要"
                                value={settings.notifications.summary}
                                onChange={(e) => updateSettings(['notifications', 'summary'], e.target.value)}
                            >
                                <SelectItem key="daily" value="daily">每日</SelectItem>
                                <SelectItem key="weekly" value="weekly">每周</SelectItem>
                                <SelectItem key="never" value="never">从不</SelectItem>
                            </Select>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
} 