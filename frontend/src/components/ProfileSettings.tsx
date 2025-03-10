'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Input, Button, Avatar, Select, SelectItem } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ProfileSettings() {
    const { user, updateUser } = useAuth();
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [theme, setTheme] = useState(user?.settings?.theme || 'system');
    const [language, setLanguage] = useState(user?.settings?.language || 'zh-CN');

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || '');
            setAvatar(user.avatar || '');
            setTheme(user.settings?.theme || 'system');
            setLanguage(user.settings?.language || 'zh-CN');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.id) return;

        try {
            await updateUser({
                ...user,
                id: user.id,
                nickname,
                avatar,
                settings: {
                    ...user?.settings,
                    theme,
                    language
                }
            });
            toast.success('个人资料已更新');
        } catch (error) {
            console.error('更新个人资料失败:', error);
            toast.error('更新个人资料失败');
        }
    };

    return (
        <Card>
            <CardBody className="gap-4">
                <div className="flex items-center gap-4">
                    <Avatar
                        src={avatar}
                        size="lg"
                        showFallback
                        name={nickname || user?.email?.charAt(0)}
                    />
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">头像</label>
                        <Input
                            type="url"
                            label="头像链接"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            placeholder="输入头像图片链接"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">昵称</label>
                    <Input
                        type="text"
                        label="昵称"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="输入您的昵称"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">主题设置</label>
                    <Select
                        label="选择主题"
                        selectedKeys={[theme]}
                        onChange={(e) => setTheme(e.target.value)}
                    >
                        <SelectItem key="system" value="system">跟随系统</SelectItem>
                        <SelectItem key="light" value="light">浅色主题</SelectItem>
                        <SelectItem key="dark" value="dark">深色主题</SelectItem>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">语言设置</label>
                    <Select
                        label="选择语言"
                        selectedKeys={[language]}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <SelectItem key="zh-CN" value="zh-CN">简体中文</SelectItem>
                        <SelectItem key="en-US" value="en-US">English</SelectItem>
                    </Select>
                </div>

                <Button
                    color="primary"
                    onClick={handleSave}
                >
                    保存设置
                </Button>
            </CardBody>
        </Card>
    );
} 