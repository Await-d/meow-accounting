/*
 * @Author: Await
 * @Date: 2025-03-05 20:41:03
 * @LastEditors: Await
 * @LastEditTime: 2025-03-17 20:09:59
 * @Description: 请填写简介
 */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@nextui-org/react';
import { Settings, Users, Database, Shield, FileText, LayoutDashboard, Users2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/PageLayout';

const menuItems = [
    {
        name: '系统设置',
        href: '/settings/system',
        icon: <LayoutDashboard size={20} />,
    },
    {
        name: '用户管理',
        href: '/settings/users',
        icon: <Users size={20} />,
    },
    {
        name: '家庭管理',
        href: '/settings/family',
        icon: <Users2 size={20} />,
    },
    {
        name: '分类管理',
        href: '/settings/category',
        icon: <Database size={20} />,
    },
    {
        name: '系统日志',
        href: '/settings/logs',
        icon: <FileText size={20} />,
    },
    {
        name: '备份恢复',
        href: '/settings/backup',
        icon: <Shield size={20} />,
    },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <PageLayout
            title="系统后台管理"
            description="配置平台参数、管理成员与权限，保持系统稳定运行。"
            backgroundVariant="minimal"
            contentClassName="py-8"
        >
            <div className="flex flex-col gap-6 lg:flex-row">
                {/* 侧边栏 */}
                <Card className="w-full max-w-sm shrink-0 border border-default-100 bg-background/70 backdrop-blur">
                    <div className="flex items-center gap-2 p-4 mb-1">
                        <motion.div
                            animate={{ rotate: [0, 15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Settings size={24} className="text-primary" />
                        </motion.div>
                        <h2 className="text-lg font-semibold">管理导航</h2>
                    </div>
                    <nav className="space-y-1 p-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'hover:bg-default-100'
                                        }`}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </Card>

                {/* 主内容区域 */}
                <Card className="flex-1 border border-default-100 bg-background/70 p-6 backdrop-blur">
                    {children}
                </Card>
            </div>
        </PageLayout>
    );
}
