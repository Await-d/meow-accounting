/*
 * @Author: Await
 * @Date: 2025-03-05 19:26:35
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:47:48
 * @Description: 请填写简介
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardBody, Input, Button, Link } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import PageLayout from '@/components/PageLayout';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
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
        <PageLayout
            title="登录喵呜记账"
            description={redirectPath ? '登录后将自动跳转回先前页面。' : '欢迎回来，继续管理您的家庭财务。'}
            backgroundVariant="default"
            maxWidth="lg"
            padding="lg"
        >
            <Card className="w-full max-w-md mx-auto border border-default-100 bg-background/80 backdrop-blur">
                <CardBody className="gap-4">
                    <div className="text-center mb-2">
                        <h1 className="text-2xl font-bold">账号登录</h1>
                        <p className="text-default-500">请输入您的邮箱和密码</p>
                        {redirectPath && (
                            <p className="text-sm text-primary mt-2">登录后将返回: {redirectPath}</p>
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
        </PageLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <PageLayout title="加载中" description="正在加载登录页面。" backgroundVariant="minimal">
                    <div className="flex justify-center items-center h-[40vh]">加载中...</div>
                </PageLayout>
            }
        >
            <LoginForm />
        </Suspense>
    );
} 