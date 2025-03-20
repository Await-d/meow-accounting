"use client";
import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Button,
    Switch,
    Select,
    SelectItem,
    Divider,
    Spinner
} from '@nextui-org/react';
import { motion } from 'framer-motion';
import { Settings, Mail, Globe, Bell, Shield, Save } from 'lucide-react';
import { useQuery, useMutation, UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

// 定义设置验证模式
const settingsSchema = z.object({
    siteName: z.string().min(1, '站点名称不能为空').max(50, '站点名称不能超过50个字符'),
    siteDescription: z.string().max(200, '站点描述不能超过200个字符'),
    adminEmail: z.string().email('请输入有效的邮箱地址'),
    language: z.string(),
    timezone: z.string(),
    enableRegistration: z.boolean(),
    enableEmailNotification: z.boolean(),
    enableSMSNotification: z.boolean(),
    maxLoginAttempts: z.number().min(1, '最小值为1').max(10, '最大值为10'),
    sessionTimeout: z.number().min(5, '最小值为5分钟').max(1440, '最大值为24小时'),
    maintenanceMode: z.boolean()
});

type Settings = z.infer<typeof settingsSchema>;

export default function SystemSettingsPage() {
    const [settings, setSettings] = React.useState<Settings>({
        siteName: '喵呜记账',
        siteDescription: '简单易用的个人和家庭记账系统',
        adminEmail: 'admin@example.com',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        enableRegistration: true,
        enableEmailNotification: true,
        enableSMSNotification: false,
        maxLoginAttempts: 5,
        sessionTimeout: 30,
        maintenanceMode: false
    });

    const [errors, setErrors] = React.useState<Partial<Record<keyof Settings, string>>>({});

    // 获取系统设置
    const { isLoading: isLoadingSettings } = useQuery<Settings>({
        queryKey: ['systemSettings'],
        queryFn: async () => {
            try {
                // TODO: 实现获取系统设置的API调用
                await new Promise(resolve => setTimeout(resolve, 1000));
                return settings;
            } catch (error) {
                toast.error('获取系统设置失败');
                throw error;
            }
        }
    });

    // 保存系统设置
    const { mutate: saveSettings, isPending: isSaving } = useMutation({
        mutationFn: async (data: Settings) => {
            // TODO: 实现保存系统设置的API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            return data;
        },
        onSuccess: () => {
            toast.success('设置保存成功');
        },
        onError: (error: Error) => {
            toast.error(`设置保存失败: ${error.message}`);
        }
    });

    const timezones = [
        { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
        { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
        { label: '纽约时间 (UTC-5)', value: 'America/New_York' }
    ];

    const languages = [
        { label: '简体中文', value: 'zh-CN' },
        { label: '繁體中文', value: 'zh-TW' },
        { label: 'English', value: 'en-US' }
    ];

    // 验证并保存设置
    const handleSave = async () => {
        try {
            // 验证设置
            const validatedSettings = settingsSchema.parse(settings);
            setErrors({});
            // 保存设置
            saveSettings(validatedSettings);
        } catch (error) {
            if (error instanceof z.ZodError) {
                // 处理验证错误
                const newErrors: Partial<Record<keyof Settings, string>> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as keyof Settings] = err.message;
                    }
                });
                setErrors(newErrors);
                toast.error('请检查输入内容');
            }
        }
    };

    // 处理输入变化
    const handleChange = (key: keyof Settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        // 清除对应的错误信息
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
        }
    };

    if (isLoadingSettings) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" label="加载中..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">系统设置</h1>
                <Button
                    color="primary"
                    variant="shadow"
                    onPress={handleSave}
                    isLoading={isSaving}
                    startContent={<Save size={16} />}
                >
                    保存更改
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本设置 */}
                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <Settings size={24} className="text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">基本设置</h3>
                            <p className="text-sm text-default-500">配置系统的基本信息</p>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Input
                            label="站点名称"
                            value={settings.siteName}
                            onChange={(e) => handleChange('siteName', e.target.value)}
                            errorMessage={errors.siteName}
                            isInvalid={!!errors.siteName}
                        />
                        <Input
                            label="站点描述"
                            value={settings.siteDescription}
                            onChange={(e) => handleChange('siteDescription', e.target.value)}
                            errorMessage={errors.siteDescription}
                            isInvalid={!!errors.siteDescription}
                        />
                        <Input
                            label="管理员邮箱"
                            value={settings.adminEmail}
                            onChange={(e) => handleChange('adminEmail', e.target.value)}
                            errorMessage={errors.adminEmail}
                            isInvalid={!!errors.adminEmail}
                            startContent={<Mail size={16} />}
                        />
                    </CardBody>
                </Card>

                {/* 本地化设置 */}
                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <Globe size={24} className="text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">本地化设置</h3>
                            <p className="text-sm text-default-500">配置系统的语言和时区</p>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Select
                            label="系统语言"
                            selectedKeys={[settings.language]}
                            onChange={(e) => handleChange('language', e.target.value)}
                            errorMessage={errors.language}
                            isInvalid={!!errors.language}
                        >
                            {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="系统时区"
                            selectedKeys={[settings.timezone]}
                            onChange={(e) => handleChange('timezone', e.target.value)}
                            errorMessage={errors.timezone}
                            isInvalid={!!errors.timezone}
                        >
                            {timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </CardBody>
                </Card>

                {/* 通知设置 */}
                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <Bell size={24} className="text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">通知设置</h3>
                            <p className="text-sm text-default-500">配置系统的通知方式</p>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">邮件通知</p>
                                <p className="text-xs text-default-500">启用系统邮件通知功能</p>
                            </div>
                            <Switch
                                isSelected={settings.enableEmailNotification}
                                onValueChange={(value) => handleChange('enableEmailNotification', value)}
                            />
                        </div>
                        <Divider />
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">短信通知</p>
                                <p className="text-xs text-default-500">启用系统短信通知功能</p>
                            </div>
                            <Switch
                                isSelected={settings.enableSMSNotification}
                                onValueChange={(value) => handleChange('enableSMSNotification', value)}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* 安全设置 */}
                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <Shield size={24} className="text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">安全设置</h3>
                            <p className="text-sm text-default-500">配置系统的安全相关选项</p>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">开放注册</p>
                                <p className="text-xs text-default-500">允许新用户注册账号</p>
                            </div>
                            <Switch
                                isSelected={settings.enableRegistration}
                                onValueChange={(value) => handleChange('enableRegistration', value)}
                            />
                        </div>
                        <Divider />
                        <Input
                            type="number"
                            label="最大登录尝试次数"
                            value={settings.maxLoginAttempts.toString()}
                            onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))}
                            errorMessage={errors.maxLoginAttempts}
                            isInvalid={!!errors.maxLoginAttempts}
                            description="超过此次数将暂时锁定账号"
                        />
                        <Input
                            type="number"
                            label="会话超时时间（分钟）"
                            value={settings.sessionTimeout.toString()}
                            onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                            errorMessage={errors.sessionTimeout}
                            isInvalid={!!errors.sessionTimeout}
                            description="用户无操作后自动退出登录的时间"
                        />
                    </CardBody>
                </Card>

                {/* 维护模式 */}
                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <Settings size={24} className="text-primary" />
                        <div>
                            <h3 className="text-xl font-bold">维护模式</h3>
                            <p className="text-sm text-default-500">系统维护相关设置</p>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">维护模式</p>
                                <p className="text-xs text-default-500">启用后仅管理员可访问系统</p>
                            </div>
                            <Switch
                                isSelected={settings.maintenanceMode}
                                onValueChange={(value) => handleChange('maintenanceMode', value)}
                                color="danger"
                            />
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
} 