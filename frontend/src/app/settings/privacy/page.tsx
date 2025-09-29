'use client';

import { useState } from 'react';
import {
    Card,
    CardBody,
    Switch,
    Input,
    Button,
    Divider,
} from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { useUpdatePrivacySettings } from '@/lib/api';

export default function PrivacyPage() {
    const { user, updateUser } = useAuth();
    // TODO: Implement proper privacy settings mutation hook
    const updatePrivacy = async (data: any) => {
        // Implementation needed
    };
    const { showToast } = useToast();
    const [guestPassword, setGuestPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePrivacyModeChange = async () => {
        try {
            setIsLoading(true);
            await updatePrivacy({
                privacy_mode: !user?.privacy_mode,
                guest_password: user?.privacy_mode ? undefined : guestPassword,
            });
            updateUser({
                ...user!,
                privacy_mode: !user?.privacy_mode,
            });
            showToast(
                user?.privacy_mode ? '已关闭隐私模式' : '已开启隐私模式',
                'success'
            );
            setGuestPassword('');
        } catch (error) {
            showToast('设置失败', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardBody className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">隐私设置</h2>
                    <p className="text-default-500 text-sm">
                        开启隐私模式后，您可以设置访客密码。访客模式下将隐藏具体金额数据。
                    </p>
                </div>

                <Divider />

                <div className="flex flex-col gap-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">隐私模式</h3>
                            <p className="text-sm text-default-500">
                                {user?.privacy_mode
                                    ? '当前已开启隐私模式'
                                    : '当前未开启隐私模式'}
                            </p>
                        </div>
                        <Switch
                            isSelected={user?.privacy_mode}
                            onValueChange={handlePrivacyModeChange}
                            isDisabled={isLoading}
                        />
                    </div>

                    {!user?.privacy_mode && (
                        <div className="space-y-4">
                            <Input
                                type="password"
                                label="访客密码"
                                placeholder="请设置访客密码"
                                value={guestPassword}
                                onChange={(e) => setGuestPassword(e.target.value)}
                                description="开启隐私模式时需要设置访客密码"
                            />
                            <Button
                                color="primary"
                                onPress={handlePrivacyModeChange}
                                isDisabled={!guestPassword || isLoading}
                                isLoading={isLoading}
                            >
                                开启隐私模式
                            </Button>
                        </div>
                    )}
                </div>
            </CardBody>
        </Card>
    );
} 