/*
 * @Author: Await
 * @Date: 2025-03-10 19:42:20
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 16:08:53
 * @Description: 仪表盘页面
 */
"use client";
import React, { useEffect, useState, useCallback } from 'react';
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
    Avatar,
    Spinner,
    Pagination,
    Input
} from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { useStatistics, useCategoryStats, useDeleteTransaction, getTransactions } from '@/lib/api';
import { ArrowUpRight, ArrowDownRight, Plus, RefreshCw, Download, Users, ChevronDown, TrendingUp, Pencil, Trash2 } from 'lucide-react';
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
    const [isTransactionListModalOpen, setIsTransactionListModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalTransactions, setTotalTransactions] = useState<Transaction[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

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
        isPersonalMode && typeof user?.id === 'number' ? user.id : undefined,
        !isPersonalMode && currentFamily ? currentFamily.id : undefined
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
    };

    // 当模式切换时，刷新数据
    useEffect(() => {
        if (user) {
            refreshAllData();
        }
    }, [isPersonalMode, currentFamily?.id]);

    // 当家庭列表加载后，如果没有选中的家庭，自动选择第一个
    useEffect(() => {
        if (families && families.length > 0 && !currentFamily) {
            setCurrentFamily(families[0]);
            setIsPersonalMode(false);
        }
    }, [families]);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user?.id, isPersonalMode, currentFamily?.id]);

    const fetchTransactions = async () => {
        // 避免未登录时加载
        if (!user) return;

        // 设置加载状态，无条件执行
        setIsLoading(true);
        console.log('开始加载交易数据...');

        try {
            let queryParams: Record<string, string> = {};

            // 根据当前模式设置查询参数
            if (isPersonalMode) {
                queryParams.user_id = String(user.id);
            } else if (currentFamily) {
                queryParams.family_id = String(currentFamily.id);
            }

            console.log('查询参数:', queryParams);
            const data = await getTransactions(queryParams);
            console.log('获取到的交易数据:', data);

            // 确保data是数组
            if (Array.isArray(data)) {
                setTransactions(data);
                console.log('成功设置交易数据，数量:', data.length);
            } else {
                console.error('返回的交易数据不是数组格式', data);
                setTransactions([]);
            }
        } catch (error) {
            console.error('获取交易记录失败', error);
            // 设置空数组避免组件报错
            setTransactions([]);
        } finally {
            setIsLoading(false);
            console.log('加载状态已重置为false');
        }
    };

    // 导出数据为CSV
    const exportToCSV = () => {
        if (!statistics) return;

        // 准备CSV数据
        const headers = ['日期', '收入', '支出', '结余'];
        const csvData = [
            headers.join(','),
            ...statistics.chart.map((item: any) => {
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

    // 在其他useEffect之后添加日志记录
    useEffect(() => {
        console.log('RecentTransactions组件状态:', {
            isLoading,
            transactionsCount: transactions?.length || 0,
            hasTransactions: Array.isArray(transactions) && transactions.length > 0
        });
    }, [transactions, isLoading]);

    // 加载更多交易数据
    const loadAllTransactions = async () => {
        try {
            setIsLoading(true);
            let queryParams: Record<string, string> = {};

            // 根据当前模式设置查询参数
            if (isPersonalMode) {
                queryParams.user_id = String(user?.id);
            } else if (currentFamily) {
                queryParams.family_id = String(currentFamily.id);
            }

            console.log('加载所有交易数据的查询参数:', queryParams);
            // 请求一个较大的数据量，便于分页显示
            const data = await getTransactions(queryParams, { pageSize: 100 });

            if (Array.isArray(data)) {
                setTotalTransactions(data);
                setTotalPages(Math.ceil(data.length / pageSize));
                console.log('加载到的所有交易数据:', data.length);
            } else {
                console.error('返回的所有交易数据不是数组格式', data);
                setTotalTransactions([]);
            }
        } catch (error) {
            console.error('获取所有交易记录失败', error);
            setTotalTransactions([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理查看更多交易
    const handleViewMoreTransactions = useCallback(() => {
        // 只设置打开模态框的状态
        setIsTransactionListModalOpen(true);
    }, []);

    // 当模态框打开时加载交易数据
    useEffect(() => {
        if (isTransactionListModalOpen) {
            loadAllTransactions();
        }
    }, [isTransactionListModalOpen]);

    // 过滤和分页显示交易数据
    const getPagedTransactions = useCallback(() => {
        let filtered = [...totalTransactions];

        // 搜索过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                (t.category_name && t.category_name.toLowerCase().includes(query)) ||
                (t.description && t.description.toLowerCase().includes(query)) ||
                (t.amount && String(t.amount).includes(query))
            );
        }

        // 返回当前页数据
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [totalTransactions, searchQuery, currentPage, pageSize]);

    // 使用useEffect处理总页数更新，避免在渲染过程中调用setState
    useEffect(() => {
        // 只有当模态框打开时才计算总页数
        if (isTransactionListModalOpen && totalTransactions.length > 0) {
            let filtered = [...totalTransactions];

            // 搜索过滤
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(t =>
                    (t.category_name && t.category_name.toLowerCase().includes(query)) ||
                    (t.description && t.description.toLowerCase().includes(query)) ||
                    (t.amount && String(t.amount).includes(query))
                );
            }

            const newTotalPages = Math.ceil(filtered.length / pageSize);
            setTotalPages(newTotalPages);
        }
    }, [totalTransactions, searchQuery, pageSize, isTransactionListModalOpen]);

    // 处理页码变化
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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
                        {/* 简化操作按钮组 - 只保留添加交易和后台管理 */}
                        <div className="flex items-center gap-3">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        color="primary"
                                        variant="shadow"
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 border-0"
                                        endContent={<ChevronDown size={16} />}
                                        startContent={<Plus size={18} />}
                                        radius="full"
                                        size="md"
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

                            {/* 管理员操作按钮 */}
                            {user?.role === 'admin' && (
                                <AdminActionButton
                                    variant="shadow"
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 border-0"
                                />
                            )}

                            {/* 主题切换按钮 */}
                            <NextUITooltip content="切换主题">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    aria-label="切换主题"
                                    radius="full"
                                    className="bg-default-100"
                                    onPress={() => {
                                        document.documentElement.classList.toggle('dark');
                                        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"
                                        className="hidden dark:block text-yellow-300" fill="currentColor">
                                        <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"></path>
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"
                                        className="block dark:hidden text-blue-900" fill="currentColor">
                                        <path d="M10 6C10 10.4183 13.5817 14 18 14C19.4386 14 20.7885 13.6203 21.9549 12.9556C21.4738 18.0175 17.1419 22 12 22C6.47715 22 2 17.5228 2 12C2 6.85808 5.98249 2.5262 11.0444 2.04506C10.3797 3.21152 10 4.56142 10 6ZM4 12C4 16.4183 7.58172 20 12 20C14.9654 20 17.5757 18.3788 18.9571 15.9546C18.6407 15.9848 18.3212 16 18 16C12.4772 16 8 11.5228 8 6C8 5.67879 8.01524 5.35933 8.04536 5.04293C5.62119 6.42426 4 9.03458 4 12Z"></path>
                                    </svg>
                                </Button>
                            </NextUITooltip>

                            {/* 刷新按钮移到右侧 */}
                            <Button
                                isIconOnly
                                variant="light"
                                aria-label="刷新数据"
                                onPress={refreshAllData}
                                radius="full"
                                className="ml-auto"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* 控制面板卡片 - 添加在统计卡片前，包含原来顶部的控件 */}
                <div className="mb-6">
                    <Card className="bg-content1/70 backdrop-blur-sm">
                        <CardBody className="py-4">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                {/* 个人/家庭模式切换 */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            size="sm"
                                            color={isPersonalMode ? "secondary" : "primary"}
                                            isSelected={isPersonalMode}
                                            onValueChange={(value) => {
                                                // 如果切换到家庭模式但没有家庭，显示提示并阻止切换
                                                if (!value && (!families || families.length === 0)) {
                                                    showToast('您还没有家庭，请先创建或加入一个家庭', 'error');
                                                    return;
                                                }
                                                setIsPersonalMode(value);
                                            }}
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
                                </div>

                                {/* 时间范围选择 */}
                                <Tabs
                                    selectedKey={timeRange}
                                    onSelectionChange={(key) => setTimeRange(key as 'month' | 'quarter' | 'year')}
                                    classNames={{
                                        base: "max-w-fit",
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
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* 统计卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <AccountsSummary
                        transactions={transactions}
                        isPersonalMode={isPersonalMode}
                        isLoading={isLoading}
                    />
                    <ExpenseSummary
                        transactions={transactions}
                        isPersonalMode={isPersonalMode}
                        isLoading={isLoading}
                    />
                    <Card className="overflow-hidden h-full border border-default-100">
                        <CardHeader className="flex gap-3 items-center">
                            <div className="p-2 rounded-full bg-blue-500/10">
                                <TrendingUp size={20} className="text-blue-500" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-md font-semibold">{isPersonalMode ? "个人结余" : "家庭结余"}</p>
                                <p className="text-small text-default-500">{isPersonalMode ? "本月收支差额" : "本月收支统计"}</p>
                            </div>
                        </CardHeader>
                        <CardBody className="py-2">
                            {statsLoading ? (
                                <Spinner size="sm" />
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-blue-500">
                                        {formatAmount((statistics?.total_income || 0) - (statistics?.total_expense || 0))}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-sm text-default-500">{timeRange === 'month' ? '本月' : timeRange === 'quarter' ? '本季度' : '今年'}</p>
                                            <p className="text-xl font-semibold text-blue-500">
                                                {formatAmount((statistics?.total_income || 0) - (statistics?.total_expense || 0))}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">{isPersonalMode ? "个人" : `${currentFamily?.name || '家庭'}`}</p>
                                            <p className="text-xl font-semibold text-blue-500">
                                                {formatAmount((statistics?.total_income || 0) - (statistics?.total_expense || 0))}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
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
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    color="default"
                                    variant="light"
                                    onPress={fetchTransactions}
                                    startContent={<RefreshCw size={14} />}
                                >
                                    刷新
                                </Button>
                                <Button
                                    size="sm"
                                    color="secondary"
                                    variant="flat"
                                    onPress={handleViewMoreTransactions}
                                >
                                    查看全部
                                </Button>
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => {
                                        // 验证在家庭模式下是否有选中的家庭
                                        if (!isPersonalMode && (!currentFamily || !families || families.length === 0)) {
                                            showToast('请先创建或加入一个家庭', 'error');
                                            return;
                                        }
                                        setIsAddTransactionModalOpen(true);
                                    }}
                                    startContent={<Plus size={14} />}
                                >
                                    添加交易
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <RecentTransactions
                                transactions={transactions}
                                isLoading={isLoading}
                                onEdit={handleEditTransaction}
                                onDelete={handleDeleteTransaction}
                                isPersonalMode={isPersonalMode}
                                userId={user?.id}
                                onViewMore={handleViewMoreTransactions}
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

                {/* 交易列表模态框 */}
                <Modal
                    isOpen={isTransactionListModalOpen}
                    onOpenChange={setIsTransactionListModalOpen}
                    size="4xl"
                    scrollBehavior="inside"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    {isPersonalMode ? "我的所有交易记录" : `${currentFamily?.name || '家庭'}交易记录`}
                                </ModalHeader>
                                <ModalBody>
                                    <div className="mb-4">
                                        <Input
                                            placeholder="搜索交易记录..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            startContent={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-default-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>}
                                            className="w-full"
                                        />
                                    </div>

                                    {isLoading ? (
                                        <div className="flex justify-center py-10">
                                            <Spinner />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {getPagedTransactions().map((transaction, index) => (
                                                    <Card key={transaction?.id || `trans-${index}`} className="bg-content1/50">
                                                        <CardBody className="p-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-full ${transaction?.type === 'income' ? 'bg-success/10' : 'bg-danger/10'}`}>
                                                                    {transaction?.type === 'income' ? (
                                                                        <ArrowUpRight size={20} className="text-success" />
                                                                    ) : (
                                                                        <ArrowDownRight size={20} className="text-danger" />
                                                                    )}
                                                                </div>

                                                                <div className="flex-grow">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <p className="font-medium">{transaction?.category_name || '未分类'}</p>
                                                                            <p className="text-xs text-default-500">
                                                                                {formatDate(transaction?.date || new Date())}
                                                                                {!isPersonalMode && transaction?.user_id && (
                                                                                    <span className={`ml-2 ${Number(transaction?.user_id) === Number(user?.id) ? 'text-primary font-medium' : 'text-default-500'}`}>
                                                                                        {transaction?.username || `用户${transaction?.user_id}`}
                                                                                        {Number(transaction?.user_id) === Number(user?.id) && ' (我)'}
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className={`font-semibold ${transaction?.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                                                                {transaction?.type === 'income' ? '+' : '-'}
                                                                                {formatAmount(transaction?.amount)}
                                                                            </p>
                                                                            {transaction?.description && (
                                                                                <p className="text-xs text-default-500">{transaction?.description}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="light"
                                                                        onPress={() => {
                                                                            onClose();
                                                                            handleEditTransaction(transaction);
                                                                        }}
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </Button>
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        variant="light"
                                                                        onPress={() => {
                                                                            if (transaction?.id) {
                                                                                handleDeleteTransaction(transaction.id);
                                                                                // 不在这里直接调用loadAllTransactions
                                                                                // 而是依赖handleDeleteTransaction内的fetchTransactions更新
                                                                            }
                                                                        }}
                                                                        className="text-danger"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))}
                                            </div>

                                            {totalPages > 1 && (
                                                <div className="flex justify-center mt-4">
                                                    <Pagination
                                                        total={totalPages}
                                                        initialPage={1}
                                                        page={currentPage}
                                                        onChange={handlePageChange}
                                                    />
                                                </div>
                                            )}
                                        </>
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
                                            setIsAddTransactionModalOpen(true);
                                        }}
                                    >
                                        添加交易
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
