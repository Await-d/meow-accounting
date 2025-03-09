/*
 * @Author: Await
 * @Date: 2025-03-05 20:41:03
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 19:59:27
 * @Description: 请填写简介
 */
'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab, Spinner } from '@nextui-org/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Key } from 'react';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
    {
        id: 'family',
        label: '家庭管理',
        href: '/settings/family'
    },
    {
        id: 'category',
        label: '分类管理',
        href: '/settings/category'
    },
    {
        id: 'routes',
        label: '路由管理',
        href: '/settings/routes'
    },
    {
        id: 'profile',
        label: '个人资料',
        href: '/settings/profile'
    },
    {
        id: 'privacy',
        label: '隐私设置',
        href: '/settings/privacy'
    }
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [selected, setSelected] = useState(pathname.split('/').pop());
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // 认证检查
    useEffect(() => {
        // 防止重复检查
        if (isRedirecting) return;

        // 如果用户未登录，重定向到登录页面
        if (!user && !isLoading) {
            setIsRedirecting(true);
            const currentPath = window.location.pathname;
            const redirectUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
            console.log('未登录，重定向到:', redirectUrl);
            router.push(redirectUrl);
            return;
        }

        // 用户信息已加载完成
        setIsLoading(false);
    }, [user, router, isLoading, isRedirecting]);

    const handleTabChange = (key: Key) => {
        setSelected(key.toString());
        const tab = tabs.find(t => t.id === key);
        if (tab) {
            router.push(tab.href);
        }
    };

    // 显示加载状态
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    // 如果正在重定向或用户未登录，不显示内容
    if (isRedirecting || !user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">设置</h1>
                    <Link href="/">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-default-100 hover:bg-default-200 transition-colors">
                            <HomeIcon className="h-5 w-5" />
                            <span>返回首页</span>
                        </button>
                    </Link>
                </div>
                <Tabs
                    aria-label="设置选项"
                    selectedKey={selected}
                    onSelectionChange={handleTabChange}
                    className="sticky top-0 bg-background/70 backdrop-blur-lg z-10"
                >
                    {tabs.map((tab) => (
                        <Tab key={tab.id} title={tab.label} />
                    ))}
                </Tabs>
                <div className="py-4">
                    {children}
                </div>
            </div>
        </div>
    );
} 