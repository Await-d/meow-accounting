/*
 * @Author: Await
 * @Date: 2025-03-04 18:53:22
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 20:10:36
 * @Description: 主页面组件
 */
'use client';

import { useState } from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { PlusIcon } from '@heroicons/react/24/solid';
import {
    TransactionList,
    TransactionForm,
    Statistics,
    CategoryStats,
    ThemeSwitch
} from '@/components';

export default function Home() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <img src="/icons/icon-192x192.png" alt="喵呜记账" className="w-8 h-8" />
                    <h1 className="text-xl font-bold">喵呜记账</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="h-5 w-5" />}
                        onPress={() => setIsFormOpen(true)}
                        className="hidden md:flex"
                    >
                        记一笔
                    </Button>
                    <ThemeSwitch />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <Statistics />
                    <CategoryStats />
                </div>
                <TransactionList />
            </div>

            {/* 记账表单模态框 */}
            <TransactionForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
            />

            {/* 移动端快速添加按钮 */}
            <Button
                color="primary"
                isIconOnly
                onPress={() => setIsFormOpen(true)}
                size="lg"
                className="fixed bottom-6 right-6 shadow-lg rounded-full md:hidden z-50"
            >
                <PlusIcon className="h-6 w-6" />
            </Button>
        </main>
    );
}