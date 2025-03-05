'use client';

import { useState } from 'react';
import { Card, CardBody, Input, Button, Link } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ email, password });
        } catch (error) {
            showToast(error instanceof Error ? error.message : '登录失败', 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 p-4">
            <Card className="w-full max-w-md">
                <CardBody className="gap-4">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold">登录</h1>
                        <p className="text-default-500">欢迎回来！</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                        <Button type="submit" color="primary" className="mt-2">
                            登录
                        </Button>

                        <div className="text-center text-small">
                            <span className="text-default-500">还没有账号？</span>
                            <Link href="/auth/register" className="ml-1">
                                立即注册
                            </Link>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
} 