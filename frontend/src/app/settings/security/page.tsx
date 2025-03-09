/*
 * @Author: Await
 * @Date: 2025-03-07 20:32:32
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:34:51
 * @Description: 请填写简介
 */
'use client';

import React, { useState } from 'react';
import { Card, CardBody, Input, Button } from '@nextui-org/react';
import { useToast } from '@/components/Toast';
import { changePassword } from '@/lib/api';

export default function SecurityPage() {
    const { showToast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 验证新密码和确认密码是否一致
            if (newPassword !== confirmPassword) {
                throw new Error('新密码和确认密码不一致');
            }

            // 验证新密码长度
            if (newPassword.length < 8) {
                throw new Error('新密码必须至少包含8个字符');
            }

            await changePassword(currentPassword, newPassword);
            showToast('密码修改成功', 'success');

            // 清空表单
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            showToast(error instanceof Error ? error.message : '修改密码失败', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardBody className="gap-4">
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">账号安全</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="当前密码"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            isRequired
                        />
                        <Input
                            label="新密码"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            isRequired
                        />
                        <Input
                            label="确认新密码"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            isRequired
                        />
                        <Button
                            type="submit"
                            color="primary"
                            isLoading={loading}
                        >
                            修改密码
                        </Button>
                    </form>
                </div>
            </CardBody>
        </Card>
    );
}