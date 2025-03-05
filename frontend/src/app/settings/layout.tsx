/*
 * @Author: Await
 * @Date: 2025-03-05 20:41:03
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 20:44:33
 * @Description: 请填写简介
 */
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody } from '@nextui-org/react';

const menuItems = [
    { href: '/settings/profile', label: '个人资料' },
    { href: '/settings/family', label: '家庭管理' },
    { href: '/settings/category', label: '分类管理' },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1">
                    <CardBody>
                        <nav className="flex flex-col gap-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-lg transition-colors ${pathname === item.href
                                        ? 'bg-primary text-white'
                                        : 'hover:bg-default-100'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </CardBody>
                </Card>
                <div className="md:col-span-3">
                    {children}
                </div>
            </div>
        </div>
    );
} 