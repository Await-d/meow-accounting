/*
 * @Author: Await
 * @Date: 2025-03-05 19:27:01
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 21:54:25
 * @Description: 请填写简介
 */
/*
 * @Author: Await
 * @Date: 2025-03-05 19:27:01
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:29:54
 * @Description: 请填写简介
 */
'use client';

import { useState } from 'react';
import { Card, CardBody, Input, Button, Link } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import PageLayout from '@/components/PageLayout';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register } = useAuth();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            return;
        }

        try {
            await register({ username, email, password });
        } catch (error) {
            showToast(error instanceof Error ? error.message : '注册失败', 'error');
        }
    };

    return (
        <PageLayout
            title="注册喵呜记账"
            description="创建新账号，与家人一起管理财务。"
            backgroundVariant="default"
            maxWidth="lg"
            padding="lg"
        >
            <Card className="w-full max-w-md mx-auto border border-default-100 bg-background/80 backdrop-blur">
                <CardBody className="gap-4">
                    <div className="text-center mb-2">
                        <h1 className="text-2xl font-bold">注册账号</h1>
                        <p className="text-default-500">填写以下信息创建新账户</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Input
                            type="text"
                            label="用户名"
                            placeholder="请输入用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />

                        <Input
                            type="email"
                            label="邮箱"
                            placeholder="请输入邮箱"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            type="password"
                            label="密码"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Input
                            type="password"
                            label="确认密码"
                            placeholder="请再次输入密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <Button type="submit" color="primary" className="mt-2">
                            注册
                        </Button>

                        <div className="text-center text-small">
                            <span className="text-default-500">已有账号？</span>
                            <Link href="/auth/login" className="ml-1">
                                立即登录
                            </Link>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </PageLayout>
    );
}