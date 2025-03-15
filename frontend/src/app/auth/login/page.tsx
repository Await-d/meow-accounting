/*
 * @Author: Await
 * @Date: 2025-03-05 19:26:35
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:47:48
 * @Description: 请填写简介
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Input, Button, Link } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirectPath, setRedirectPath] = useState('');
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // 获取重定向路径
    useEffect(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
            setRedirectPath(redirect);
            console.log('登录后将重定向到:', redirect);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
            // 登录成功后，如果有重定向路径，则跳转到该路径
            if (redirectPath) {
                router.push(redirectPath);
            }
            // 否则默认跳转到首页（由useAuth中的login函数处理）
        } catch (error) {
            // showToast(error instanceof Error ? error.message : '登录失败', 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 p-4">
            <Card className="w-full max-w-md">
                <CardBody className="gap-4">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold">登录</h1>
                        <p className="text-default-500">欢迎回来！</p>
                        {redirectPath && (
                            <p className="text-sm text-primary mt-2">
                                登录后将返回到您之前访问的页面
                            </p>
                        )}
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