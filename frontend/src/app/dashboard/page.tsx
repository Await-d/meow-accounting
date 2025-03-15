/*
 * @Author: Await
 * @Date: 2025-03-10 19:42:20
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 22:18:31
 * @Description: 仪表盘页面
 */
"use client";
import React, { useEffect, useState } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Tabs,
    Tab,
    Tooltip as NextUITooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Switch,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar
} from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { useStatistics, useCategoryStats, useDeleteTransaction, getTransactions } from '@/lib/api';
import { ArrowUpRight, ArrowDownRight, Plus, RefreshCw, Download, Users, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';
import { Transaction, TransactionType } from '@/lib/types';
import StatisticsCard from '@/components/dashboard/StatisticsCard';
import IncomeExpenseChart from '@/components/dashboard/IncomeExpenseChart';
import CategoryPieChart from '@/components/dashboard/CategoryPieChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import dynamic from 'next/dynamic';
import { WalletIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';
import { useFamily } from '@/hooks/useFamily';
import { Logo, LoadingScreen } from '@/components';
import { motion } from 'framer-motion';
import AdminActionButton from '@/components/dashboard/AdminActionButton';
import TransactionModal from '@/components/transactions/TransactionModal';
import ExpenseSummary from '../../components/dashboard/ExpenseSummary';
import AccountsSummary from '../../components/dashboard/AccountsSummary';

// 使用动态导入并禁用SSR
const DashboardBackground = dynamic(
    () => import('@/components/dashboard/DashboardBackground'),
    { ssr: false }
);


export default function DashboardPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();
    const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPersonalMode, setIsPersonalMode] = useState(false);
    const { showToast } = useToast();
    const { families, currentFamily, setCurrentFamily } = useFamily();
    const [greeting, setGreeting] = useState('');
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<TransactionType>('expense');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const deleteTransactionMutation = useDeleteTransaction();

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

    // 获取统计数据 - 根据个人/家庭模式传递不同参数
    const { data: statistics, isLoading: statsLoading, refetch: refetchStats } = useStatistics(
        timeRange,
        isPersonalMode && typeof user?.id === 'number' ? user.id : undefined
    );

    // 获取分类统计 - 根据个人/家庭模式传递不同参数
    const { data: categoryStats, isLoading: categoryLoading, refetch: refetchCategoryStats } = useCategoryStats(
        timeRange,
        isPersonalMode ? user?.id : undefined,
        !isPersonalMode && currentFamily ? currentFamily.id : undefined
    );
    // 刷新所有数据
    const refreshAllData = () => {
        refetchStats();
        refetchCategoryStats();
        fetchTransactions();
        showToast('数据已刷新', 'success');
    };

    // 当模式切换时，刷新数据
    useEffect(() => {
        if (user) {
            console.log('isPersonalMode', isPersonalMode, user?.id, currentFamily?.id);
            refreshAllData();
        }
    }, [isPersonalMode, currentFamily?.id]);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user?.id]);

    const fetchTransactions = async () => {
        // 避免重复加载或未登录时加载
        if (isLoading || !user) return;

        setIsLoading(true);
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('获取交易记录失败', error);
            // 设置空数组避免组件报错
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 导出数据为CSV
    const exportToCSV = () => {
        if (!statistics) return;

        // 准备CSV数据
        const headers = ['日期', '收入', '支出', '结余'];
        const csvData = [
            headers.join(','),
            ...statistics.chart.map(item => {
                const balance = item.income - item.expense;
                return `${item.date},${item.income},${item.expense},${balance}`;
            })
        ].join('\n');

        // 创建下载链接
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `财务统计_${timeRange}_${dayjs().format('YYYY-MM-DD')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 格式化金额
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // 格式化日期
    const formatDate = (date: Date | string) => {
        return dayjs(date).format('YYYY-MM-DD');
    };

    // 处理添加新交易 - 现在打开模态框而不是跳转页面
    const handleAddTransaction = (type: TransactionType) => {
        setCurrentTransaction(undefined);
        setTransactionType(type);
        setIsAddTransactionModalOpen(true);
    };

    // 交易创建成功后的回调
    const handleTransactionSuccess = () => {
        refreshAllData();
        // 关闭模态框
        setIsAddTransactionModalOpen(false);
    };

    // 处理家庭切换
    const handleFamilyChange = (familyId: number) => {
        const selectedFamily = families?.find(f => f.id === familyId);
        if (selectedFamily) {
            setCurrentFamily(selectedFamily);
            setIsPersonalMode(false); // 切换到家庭后，自动切换到家庭模式
        }
    };

    // 添加加载状态
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [currentTransaction, setCurrentTransaction] = useState<Transaction | undefined>(undefined);

    useEffect(() => {
        // 模拟页面加载
        const timer = setTimeout(() => {
            setIsPageLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    const handleEditTransaction = (transaction: Transaction) => {
        setCurrentTransaction(transaction);
        setIsAddTransactionModalOpen(true);
    };

    const handleDeleteTransaction = async (id: string | number) => {
        if (confirm('确定要删除这笔交易吗？')) {
            try {
                await deleteTransactionMutation.mutateAsync(id);
                fetchTransactions();
            } catch (error) {
                console.error('删除交易失败', error);
            }
        }
    };

    if (isPageLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="relative min-h-screen" suppressHydrationWarning>
            {/* 背景效果 */}
            <DashboardBackground />

            <div className="container mx-auto px-4 py-8">
                <motion.div
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3">
                        <Logo variant="default" showText={false} />
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <span>仪表盘</span>
                                {currentRoute?.name && currentRoute.name !== '仪表盘' && (
                                    <span className="text-default-500">- {currentRoute.name}</span>
                                )}
                            </h1>
                            <p className="text-sm text-default-500">
                                {user ? `${greeting}，${user.username}` : '欢迎使用喵呜记账'}
                                {isPersonalMode && <span className="ml-2 text-primary font-medium">(个人模式)</span>}
                                {!isPersonalMode && currentFamily && <span className="ml-2 text-success font-medium">({currentFamily.name})</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {/* 个人/家庭模式切换 */}
                        <Card className="bg-content2/60 backdrop-blur-sm border border-default-100">
                            <CardBody className="py-2 px-4 flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        size="sm"
                                        color={isPersonalMode ? "secondary" : "primary"}
                                        isSelected={isPersonalMode}
                                        onValueChange={setIsPersonalMode}
                                        startContent={<UsersIcon className="h-4 w-4" />}
                                        endContent={<WalletIcon className="h-4 w-4" />}
                                    />
                                    <span className="text-sm font-medium whitespace-nowrap">
                                        {isPersonalMode ? '个人数据' : '家庭数据'}
                                    </span>
                                </div>

                                {/* 家庭选择下拉菜单 */}
                                {!isPersonalMode && families && families.length > 0 && (
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button
                                                variant="flat"
                                                size="sm"
                                                startContent={<Users size={16} />}
                                                endContent={<ChevronDown size={16} />}
                                                color="primary"
                                            >
                                                {currentFamily?.name || '选择家庭'}
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu aria-label="家庭选择">
                                            {families.map((family) => (
                                                <DropdownItem
                                                    key={family.id}
                                                    onPress={() => handleFamilyChange(family.id)}
                                                    startContent={
                                                        <Avatar
                                                            name={family.name.charAt(0)}
                                                            size="sm"
                                                            radius="full"
                                                            className="mr-2 bg-primary/20"
                                                        />
                                                    }
                                                    description={family.description}
                                                    className={currentFamily?.id === family.id ? "bg-primary/10" : ""}
                                                >
                                                    {family.name}
                                                </DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                    </Dropdown>
                                )}
                            </CardBody>
                        </Card>

                        {/* 统一的操作按钮组 */}
                        <div className="flex gap-2">
                            <Tabs
                                selectedKey={timeRange}
                                onSelectionChange={(key) => setTimeRange(key as 'month' | 'quarter' | 'year')}
                                classNames={{
                                    base: "w-full",
                                    tabList: "gap-2 relative rounded-lg p-1 bg-default-100",
                                    tab: "max-w-fit px-3 h-8 data-[selected=true]:bg-primary data-[selected=true]:text-white",
                                    cursor: "w-full",
                                    tabContent: "group-data-[selected=true]:text-inherit"
                                }}
                                size="sm"
                            >
                                <Tab key="month" title="本月" />
                                <Tab key="quarter" title="本季度" />
                                <Tab key="year" title="本年" />
                            </Tabs>
                            <Button
                                isIconOnly
                                variant="light"
                                aria-label="刷新数据"
                                onPress={refreshAllData}
                            >
                                <RefreshCw className="h-5 w-5" />
                            </Button>

                            <NextUITooltip content="导出数据">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={exportToCSV}
                                    isDisabled={statsLoading || !statistics}
                                >
                                    <Download size={18} />
                                </Button>
                            </NextUITooltip>

                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        color="primary"
                                        variant="shadow"
                                        className="bg-gradient-to-r from-primary to-secondary border-0"
                                        endContent={<ChevronDown size={16} />}
                                        startContent={<Plus size={18} />}
                                    >
                                        添加交易
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="交易操作">
                                    <DropdownItem
                                        key="add-expense"
                                        description="记录新的支出"
                                        startContent={<ArrowDownRight className="text-danger" size={18} />}
                                        onPress={() => handleAddTransaction('expense')}
                                    >
                                        添加支出
                                    </DropdownItem>
                                    <DropdownItem
                                        key="add-income"
                                        description="记录新的收入"
                                        startContent={<ArrowUpRight className="text-success" size={18} />}
                                        onPress={() => handleAddTransaction('income')}
                                    >
                                        添加收入
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>

                            {user?.role === 'admin' && (
                                <AdminActionButton variant="shadow" />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <AccountsSummary
                        transactions={transactions}
                        isPersonalMode={isPersonalMode}
                    />
                    <ExpenseSummary
                        transactions={transactions}
                        isPersonalMode={isPersonalMode}
                    />
                    <StatisticsCard
                        title={isPersonalMode ? "个人结余" : "家庭结余"}
                        value={(statistics?.total_income || 0) - (statistics?.total_expense || 0)}
                        isLoading={statsLoading}
                        type="balance"
                    />
                </div>

                {/* 图表和最近交易 */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <IncomeExpenseChart
                        statistics={statistics}
                        isLoading={statsLoading}
                        timeRange={timeRange}
                    />

                    <Card className="overflow-hidden border border-default-100">
                        <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                            <h4 className="font-bold text-large">支出分类占比</h4>
                            <p className="text-tiny text-default-500">
                                {timeRange === 'month' ? '本月' : timeRange === 'quarter' ? '本季度' : '本年'}支出分类比例
                            </p>
                        </CardHeader>
                        <CardBody className="py-5 h-80">
                            <CategoryPieChart data={categoryStats} isLoading={categoryLoading} />
                        </CardBody>
                    </Card>
                </motion.div>

                {/* 最近交易 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="overflow-hidden border border-default-100">
                        <CardHeader className="pb-0 pt-4 px-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-large">
                                    {isPersonalMode ? "我的最近交易" : `${currentFamily?.name || '家庭'}最近交易`}
                                </h4>
                                <p className="text-tiny text-default-500">最近的5笔交易记录</p>
                            </div>
                            <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => setIsAddTransactionModalOpen(true)}
                                startContent={<Plus size={14} />}
                            >
                                添加交易
                            </Button>
                        </CardHeader>
                        <CardBody>
                            <RecentTransactions
                                transactions={transactions}
                                isLoading={isLoading}
                                onEdit={handleEditTransaction}
                                onDelete={handleDeleteTransaction}
                                isPersonalMode={isPersonalMode}
                                userId={user?.id}
                            />
                        </CardBody>
                    </Card>
                </motion.div>

                {/* 交易详情模态框 */}
                <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    交易详情
                                </ModalHeader>
                                <ModalBody>
                                    {selectedTransaction && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between">
                                                <span className="text-default-500">类型</span>
                                                <span
                                                    className={selectedTransaction.type === 'income' ? 'text-success' : selectedTransaction.type === 'expense' ? 'text-danger' : 'text-warning'}>
                                                    {selectedTransaction.type === 'income' ? '收入' : selectedTransaction.type === 'expense' ? '支出' : '转账'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">金额</span>
                                                <span className="font-semibold">
                                                    {formatAmount(selectedTransaction.amount)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">分类</span>
                                                <span>{selectedTransaction.category_name || '未分类'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">日期</span>
                                                <span>{formatDate(selectedTransaction.date)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-default-500">描述</span>
                                                <span>{selectedTransaction.description || '无描述'}</span>
                                            </div>
                                        </div>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="danger" variant="light" onPress={onClose}>
                                        关闭
                                    </Button>
                                    <Button
                                        color="primary"
                                        onPress={() => {
                                            onClose();
                                            if (selectedTransaction) {
                                                setCurrentTransaction(selectedTransaction);
                                                setIsAddTransactionModalOpen(true);
                                            }
                                        }}
                                    >
                                        编辑
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>

                {/* 新增交易模态框 */}
                <TransactionModal
                    isOpen={isAddTransactionModalOpen}
                    onClose={() => setIsAddTransactionModalOpen(false)}
                    onSuccess={handleTransactionSuccess}
                    transaction={currentTransaction}
                    type={transactionType}
                    familyId={!isPersonalMode && currentFamily ? currentFamily.id.toString() : undefined}
                />
            </div>
        </div>
    );
}
