/*
 * @Author: Await
 * @Date: 2025-03-04 18:53:22
 * @LastEditors: Await
 * @LastEditTime: 2025-03-14 20:07:19
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
import { Card, CardBody, Button, Tooltip, CardHeader, Chip, Divider, Tabs, Tab, Input } from '@nextui-org/react';
import { PlusIcon, Cog6ToothIcon, ArrowPathIcon, ChartBarIcon, CreditCardIcon, HomeIcon, ArrowUpIcon } from '@heroicons/react/24/solid';
import {
    TransactionForm,
    Statistics,
    ThemeSwitch,
    FamilySelector,
    ErrorBoundary,
    Logo,
    LoadingScreen,
    BackgroundEffect,
    FeatureCard,
    AnimatedTitle
} from '@/components';
import CategoryStats from '@/components/CategoryStats';
import TransactionList from '@/components/TransactionList';
import Skeleton from '@/components/Skeleton';
import type { TimeRange, User } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BarChart3, PieChart, LineChart, Users, Wallet, Sparkles, ArrowRight, ChevronRight, Star, Clock, Settings, Download } from 'lucide-react';

export default function Home() {
    const router = useRouter();
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

    useEffect(() => {
        if (user) {
            // 如果用户已登录，根据设置跳转到默认路由
            if (user.default_route) {
                router.push(user.default_route);
            } else {
                // 如果没有设置默认路由，跳转到仪表盘
                router.push('/dashboard');
            }
        }
    }, [user, router]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // 在 return 语句前添加加载状态的渲染
    if (isLoading) {
        return <LoadingScreen />;
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

    // 如果用户已登录，不显示介绍页面
    if (user) {
        return null;
    }

    return (
        <main className="relative overflow-hidden">
            {/* 背景效果 */}
            <BackgroundEffect />

            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* 顶部导航 */}
                <motion.div
                    className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-12 pt-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Logo variant="large" />
                    <div className="flex items-center gap-3">
                        <ThemeSwitch />
                        {user ? (
                            <Link href="/dashboard">
                                <Button color="primary" size="lg" className="px-6">
                                    进入应用
                                </Button>
                            </Link>
                        ) : (
                            <div className="flex gap-2">
                                <Link href="/auth/login">
                                    <Button variant="flat" size="lg">
                                        登录
                                    </Button>
                                </Link>
                                <Link href="/auth/register">
                                    <Button color="primary" size="lg" className="bg-gradient-to-r from-primary to-secondary border-0">
                                        注册
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 英雄区域 */}
                <div className="py-16 md:py-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <AnimatedTitle
                                title="智能家庭记账"
                                subtitle="轻松管理财务，实现财务自由"
                                size="xl"
                                withUnderline
                            />

                            <p className="text-xl text-default-600 mt-6">
                                喵呜记账是一款专为家庭设计的财务管理工具，帮助您和家人共同记录收支，分析消费习惯，实现财务目标。
                            </p>

                            <div className="flex flex-wrap gap-4 mt-8">
                                <Link href="/auth/register">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="bg-gradient-to-r from-primary to-secondary border-0 px-8"
                                        endContent={<ArrowRight size={16} />}
                                    >
                                        立即开始
                                    </Button>
                                </Link>
                                <Link href="/dashboard">
                                    <Button
                                        variant="bordered"
                                        size="lg"
                                        className="border-default-200"
                                    >
                                        了解更多
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex items-center gap-2 mt-6">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-default-100 flex items-center justify-center border-2 border-background">
                                            <span className="text-xs">👤</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-default-500 text-sm">
                                    已有 <span className="font-semibold text-foreground">1,000+</span> 家庭正在使用
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="absolute -top-10 -left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
                            <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-secondary/10 rounded-full blur-xl" />

                            <Card className="overflow-hidden border border-default-100">
                                <CardBody className="p-0">
                                    <img
                                        src="/icons/icon-192x192.png"
                                        alt="喵呜记账应用展示"
                                        className="w-full h-auto object-cover aspect-video bg-default-100 p-8"
                                        onError={(e) => {
                                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 400'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientUnits='userSpaceOnUse' x1='400' y1='50' x2='400' y2='350'%3E%3Cstop offset='0' stop-color='%23777' stop-opacity='0.7'/%3E%3Cstop offset='1' stop-color='%23444' stop-opacity='0.4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23a)' width='800' height='400'/%3E%3Cg fill-opacity='0.4'%3E%3Ccircle fill='%23FFF' cx='400' cy='200' r='150'/%3E%3Ccircle fill='%23DDD' cx='400' cy='200' r='100'/%3E%3Ccircle fill='%23999' cx='400' cy='200' r='50'/%3E%3C/g%3E%3Ctext x='400' y='220' font-family='Arial' font-size='40' text-anchor='middle' fill='%23FFFFFF'%3E喵呜记账%3C/text%3E%3C/svg%3E";
                                        }}
                                    />
                                </CardBody>
                            </Card>

                            <motion.div
                                className="absolute -bottom-6 -right-6 bg-background p-3 rounded-xl shadow-lg border border-default-100"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.8 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-default-500">本月结余</p>
                                        <p className="font-semibold text-success">+¥3,240.50</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* 特性部分 */}
                <div className="py-20">
                    <AnimatedTitle
                        title="强大功能"
                        subtitle="专为家庭财务管理设计的全方位解决方案"
                        align="center"
                        className="mb-16"
                        withUnderline
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            title="智能记账"
                            description="简单直观地记录日常收入和支出，支持多种分类和标签，让记账变得轻松愉快。"
                            icon={<Wallet className="w-8 h-8" />}
                            gradient="primary"
                        />

                        <FeatureCard
                            title="数据分析"
                            description="智能分析您的消费习惯，生成直观的图表和报告，帮助您了解资金流向。"
                            icon={<BarChart3 className="w-8 h-8" />}
                            gradient="success"
                        />

                        <FeatureCard
                            title="家庭共享"
                            description="邀请家人加入，共同管理家庭财务，设置不同权限，保护隐私的同时实现协作。"
                            icon={<Users className="w-8 h-8" />}
                            gradient="warning"
                        />

                        <FeatureCard
                            title="预算规划"
                            description="设置月度或年度预算目标，系统自动追踪支出情况，帮助您控制消费。"
                            icon={<PieChart className="w-8 h-8" />}
                            gradient="danger"
                        />

                        <FeatureCard
                            title="定期报告"
                            description="自动生成每周、每月财务报告，通过邮件发送，让您随时了解财务状况。"
                            icon={<Clock className="w-8 h-8" />}
                            gradient="secondary"
                        />

                        <FeatureCard
                            title="数据导出"
                            description="支持多种格式导出数据，方便您进行备份或进一步分析。"
                            icon={<Download className="w-8 h-8" />}
                            gradient="primary"
                        />
                    </div>
                </div>

                {/* 行动召唤 */}
                <motion.div
                    className="py-16 mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary-900/40 to-secondary-900/40 backdrop-blur-sm">
                        <CardBody className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-4 text-center md:text-left">
                                    <h2 className="text-3xl font-bold">准备好开始使用了吗？</h2>
                                    <p className="text-xl text-default-600">
                                        加入我们，开始智能管理您的家庭财务
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Link href="/auth/register">
                                        <Button
                                            color="primary"
                                            size="lg"
                                            className="bg-gradient-to-r from-primary to-secondary border-0 px-8"
                                        >
                                            免费注册
                                        </Button>
                                    </Link>
                                    <Link href="/auth/login">
                                        <Button
                                            variant="flat"
                                            size="lg"
                                            className="bg-background/20 backdrop-blur-md"
                                        >
                                            登录账号
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

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