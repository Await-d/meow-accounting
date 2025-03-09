/*
 * @Author: Await
 * @Date: 2025-03-04 18:53:22
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 20:06:50
 * @Description: 请填写简介
 */
/*
 * @Author: Await
 * @Date: 2025-03-04 18:53:22
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:48:19
 * @Description: 主页面组件
 */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Tooltip, CardHeader, Chip, Divider, Tabs, Tab } from '@nextui-org/react';
import { PlusIcon, Cog6ToothIcon, ArrowPathIcon, ChartBarIcon, CreditCardIcon, HomeIcon, ArrowUpIcon } from '@heroicons/react/24/solid';
import {
    TransactionList,
    TransactionForm,
    Statistics,
    CategoryStats,
    ThemeSwitch,
    FamilySelector,
    Skeleton
} from '@/components';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { TimeRange } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function Home() {
    const { user } = useAuth();
    const [greeting, setGreeting] = useState('');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 设置问候语
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 6) {
            setGreeting('夜深了');
        } else if (hour < 12) {
            setGreeting('早上好');
        } else if (hour < 14) {
            setGreeting('中午好');
        } else if (hour < 18) {
            setGreeting('下午好');
        } else {
            setGreeting('晚上好');
        }
    }, []);

    // 监听滚动位置，控制返回顶部按钮的显示
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 添加加载状态监听
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // 在 return 语句前添加加载状态的渲染
    if (isLoading) {
        return (
            <main className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10">
                            <Skeleton />
                        </div>
                        <div>
                            <div className="w-24 h-6">
                                <Skeleton />
                            </div>
                            <div className="w-32 h-4 mt-1">
                                <Skeleton />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-9">
                            <Skeleton />
                        </div>
                        <div className="w-9 h-9">
                            <Skeleton />
                        </div>
                    </div>
                </div>
                <div className="w-full h-96">
                    <Skeleton />
                </div>
            </main>
        );
    }

    // 动画样式
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const staggerChildren = {
        animate: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <main className="container mx-auto px-4 py-6 max-w-7xl">
            <motion.div
                className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6"
                {...fadeIn}
            >
                <div className="flex items-center gap-3">
                    <img src="/icons/icon-192x192.png" alt="喵呜记账" className="w-10 h-10 rounded-lg shadow-sm" />
                    <div>
                        <h1 className="text-xl font-bold">喵呜记账</h1>
                        {user && (
                            <p className="text-sm text-default-500">
                                {greeting}，{user.username}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeSwitch />
                    {user ? (
                        <Link href="/dashboard">
                            <Button color="primary">
                                进入应用
                            </Button>
                        </Link>
                    ) : (
                        <div className="flex gap-2">
                            <Link href="/login">
                                <Button variant="flat">
                                    登录
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button color="primary">
                                    注册
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12"
                variants={staggerChildren}
                initial="initial"
                animate="animate"
            >
                <motion.div className="space-y-6" {...fadeIn}>
                    <h2 className="text-3xl font-bold">智能家庭记账，轻松管理财务</h2>
                    <p className="text-lg text-default-600">
                        喵呜记账是一款专为家庭设计的财务管理工具，帮助您和家人共同记录收支，分析消费习惯，实现财务目标。
                    </p>
                    <div className="flex gap-4 mt-8">
                        {!user && (
                            <Link href="/register">
                                <Button color="primary" size="lg">
                                    立即开始
                                </Button>
                            </Link>
                        )}
                        <Link href="/about">
                            <Button variant="flat" size="lg">
                                了解更多
                            </Button>
                        </Link>
                    </div>
                </motion.div>
                <motion.div {...fadeIn}>
                    <img
                        src="/images/hero-image.png"
                        alt="喵呜记账应用展示"
                        className="w-full h-auto rounded-xl shadow-lg"
                        onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/600x400/3f51b5/ffffff?text=喵呜记账";
                        }}
                    />
                </motion.div>
            </motion.div>

            <motion.div className="mt-24 space-y-16" {...fadeIn}>
                <h2 className="text-2xl font-bold text-center">主要功能</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <CreditCardIcon className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">收支记录</h3>
                            <p className="text-default-500">
                                简单直观地记录日常收入和支出，支持多种分类和标签，让记账变得轻松愉快。
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                                <ChartBarIcon className="w-8 h-8 text-success" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">数据分析</h3>
                            <p className="text-default-500">
                                智能分析您的消费习惯，生成直观的图表和报告，帮助您了解资金流向。
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                                <HomeIcon className="w-8 h-8 text-warning" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">家庭共享</h3>
                            <p className="text-default-500">
                                邀请家人加入，共同管理家庭财务，设置不同权限，保护隐私的同时实现协作。
                            </p>
                        </div>
                    </Card>
                </div>
            </motion.div>

            <motion.div className="mt-24 mb-16" {...fadeIn}>
                <Card className="p-8 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-4 text-center md:text-left">
                            <h2 className="text-2xl font-bold">准备好开始使用了吗？</h2>
                            <p className="text-default-600">
                                加入我们，开始智能管理您的家庭财务
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {!user ? (
                                <>
                                    <Link href="/register">
                                        <Button color="primary" size="lg">
                                            免费注册
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button variant="flat" size="lg">
                                            登录账号
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <Link href="/dashboard">
                                    <Button color="primary" size="lg">
                                        进入应用
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>
            </motion.div>

            {showScrollTop && (
                <Button
                    isIconOnly
                    color="primary"
                    variant="flat"
                    className="fixed bottom-6 right-6 z-50 rounded-full"
                    onClick={scrollToTop}
                >
                    <ArrowUpIcon className="w-5 h-5" />
                </Button>
            )}
        </main>
    );
}