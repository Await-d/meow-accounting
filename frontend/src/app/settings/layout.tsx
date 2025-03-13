/*
 * @Author: Await
 * @Date: 2025-03-05 20:41:03
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:29:34
 * @Description: 请填写简介
 */
'use client';

import React from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import { usePathname, useRouter } from 'next/navigation';
import {
    User,
    Shield,
    Eye,
    List,
    Users,
    Mail,
    Route,
    Database,
    Settings,
    UserCog
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense } from 'react';
import { Spinner } from '@nextui-org/react';

const SettingsLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    const { currentRoute } = useRoute();
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        {
            id: 'profile',
            label: '个人资料',
            path: '/settings/profile',
            icon: User,
            permission: 'profile.view'
        },
        {
            id: 'security',
            label: '安全设置',
            path: '/settings/security',
            icon: Shield,
            permission: 'security.view'
        },
        {
            id: 'privacy',
            label: '隐私设置',
            path: '/settings/privacy',
            icon: Eye,
            permission: 'privacy.view'
        },
        {
            id: 'category',
            label: '分类管理',
            path: '/settings/category',
            icon: List,
            permission: 'category.manage'
        },
        {
            id: 'family',
            label: '家庭管理',
            path: '/settings/family',
            icon: Users,
            permission: 'family.manage'
        },
        {
            id: 'invitations',
            label: '邀请管理',
            path: '/settings/invitations',
            icon: Mail,
            permission: 'invitations.manage'
        },
        {
            id: 'routes',
            label: '路由管理',
            path: '/settings/routes',
            icon: Route,
            permission: 'routes.manage'
        },
        {
            id: 'users',
            label: '用户管理',
            path: '/settings/users',
            icon: UserCog,
            permission: 'users.manage'
        },
        {
            id: 'cache',
            label: '缓存管理',
            path: '/settings/cache',
            icon: Database,
            permission: 'cache.manage'
        },
        {
            id: 'custom',
            label: '自定义设置',
            path: '/settings/custom',
            icon: Settings,
            permission: 'settings.customize'
        }
    ];

    // 检查用户是否有权限访问某个tab
    const hasPermission = (permission: string) => {
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    };

    // 使用 useMemo 缓存授权标签页，只在 user.permissions 变化时重新计算
    const authorizedTabs = React.useMemo(() =>
        tabs.filter(tab => hasPermission(tab.permission)),
        [user?.permissions] // 只在权限变化时重新计算
    );

    const currentTab = authorizedTabs.find(tab => pathname.startsWith(tab.path))?.id || 'profile';

    // 修改权限检查逻辑，避免在加载状态时跳转
    React.useEffect(() => {
        if (isLoading) return; // 正在加载时不进行跳转

        const currentPath = pathname;
        const isAuthorizedPath = authorizedTabs.some(tab => currentPath.startsWith(tab.path));

        if (!isAuthorizedPath && authorizedTabs.length > 0) {
            router.push(authorizedTabs[0].path);
        }
    }, [pathname, authorizedTabs, router, isLoading]);

    // 页面切换动画
    const pageTransition = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    };

    return (
        <ErrorBoundary>
            <Suspense fallback={
                <div className="flex justify-center items-center h-screen">
                    <Spinner size="lg" />
                </div>
            }>
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageTransition}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex flex-col gap-6">
                            <div className="w-full">
                                <h1 className="text-2xl font-bold mb-6">系统设置</h1>
                                <Tabs
                                    aria-label="设置导航"
                                    selectedKey={currentTab}
                                    onSelectionChange={(key) => {
                                        const tab = authorizedTabs.find(t => t.id === key);
                                        if (tab) {
                                            router.push(tab.path);
                                        }
                                    }}
                                    variant="underlined"
                                    classNames={{
                                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                        cursor: "w-full bg-primary",
                                        tab: "max-w-fit px-0 h-12",
                                        tabContent: "group-data-[selected=true]:text-primary"
                                    }}
                                >
                                    {authorizedTabs.map(tab => (
                                        <Tab
                                            key={tab.id}
                                            title={
                                                <div className="flex items-center gap-2">
                                                    <tab.icon size={18} />
                                                    <span>{tab.label}</span>
                                                </div>
                                            }
                                        />
                                    ))}
                                </Tabs>
                            </div>
                            <div className="w-full">
                                <div className="bg-content1 p-6 rounded-lg shadow-sm">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Suspense>
        </ErrorBoundary>
    );
};

export default SettingsLayout; 