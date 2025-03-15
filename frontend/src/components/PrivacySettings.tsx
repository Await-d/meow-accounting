/*
 * @Author: Await
 * @Date: 2025-03-10 19:49:09
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 20:38:59
 * @Description: 请填写简介
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Switch, Button, Select, SelectItem } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function PrivacySettings() {
    const { user, updateUser } = useAuth();
    const [showAmount, setShowAmount] = useState(true);
    const [showCategory, setShowCategory] = useState(true);
    const [dataRetention, setDataRetention] = useState('forever');

    useEffect(() => {
        if (user?.settings?.privacy) {
            setShowAmount(user.settings.privacy.showAmount ?? true);
            setShowCategory(user.settings.privacy.showCategory ?? true);
            setDataRetention(user.settings.privacy.dataRetention ?? 'forever');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.id) return;

        try {
            await updateUser({
                ...user,
                id: user.id,
                settings: {
                    ...user.settings,
                    privacy: {
                        showAmount,
                        showCategory,
                        dataRetention
                    }
                }
            });
            toast.success('隐私设置已更新');
        } catch (error) {
            console.error('更新隐私设置失败:', error);
            toast.error('更新隐私设置失败');
        }
    };

    return (
        <Card>
            <CardBody className="gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">账单金额显示</label>
                    <Switch
                        isSelected={showAmount}
                        onValueChange={setShowAmount}
                    >
                        在共享账单中显示具体金额
                    </Switch>
                    <p className="text-sm text-default-400">
                        关闭后，其他家庭成员将无法看到您的具体账单金额
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">账单分类显示</label>
                    <Switch
                        isSelected={showCategory}
                        onValueChange={setShowCategory}
                    >
                        在共享账单中显示账单分类
                    </Switch>
                    <p className="text-sm text-default-400">
                        关闭后，其他家庭成员将无法看到您的账单分类信息
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">数据保留期限</label>
                    <Select
                        label="选择数据保留期限"
                        selectedKeys={[dataRetention]}
                        onChange={(e) => setDataRetention(e.target.value)}
                    >
                        <SelectItem key="forever" value="forever">永久保留</SelectItem>
                        <SelectItem key="1year" value="1year">保留一年</SelectItem>
                        <SelectItem key="6months" value="6months">保留六个月</SelectItem>
                        <SelectItem key="3months" value="3months">保留三个月</SelectItem>
                    </Select>
                    <p className="text-sm text-default-400">
                        超过保留期限的数据将被自动删除
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