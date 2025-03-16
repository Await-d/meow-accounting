import React from 'react';
import { Card, CardBody, Spinner } from '@nextui-org/react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

type StatisticsCardProps = {
    title: string;
    value: number;
    isLoading: boolean;
    type: 'income' | 'expense' | 'balance';
    description?: string;
};

export default function StatisticsCard({ title, value, isLoading, type, description }: StatisticsCardProps) {
    // 获取颜色和图标
    const getColorAndIcon = () => {
        switch (type) {
            case 'income':
                return {
                    textColor: 'text-success',
                    bgColor: 'bg-success/10',
                    gradientClass: 'from-success-500/20 to-success-700/5',
                    borderColor: 'border-success/20',
                    icon: <ArrowUpRight className="text-success" />
                };
            case 'expense':
                return {
                    textColor: 'text-danger',
                    bgColor: 'bg-danger/10',
                    gradientClass: 'from-danger-500/20 to-danger-700/5',
                    borderColor: 'border-danger/20',
                    icon: <ArrowDownRight className="text-danger" />
                };
            case 'balance':
            default:
                return {
                    textColor: value >= 0 ? 'text-primary' : 'text-danger',
                    bgColor: value >= 0 ? 'bg-blue-500/10' : 'bg-danger/10',
                    gradientClass: value >= 0 ? 'from-blue-500/20 to-blue-700/5' : 'from-danger-500/20 to-danger-700/5',
                    borderColor: value >= 0 ? 'border-blue-500/20' : 'border-danger/20',
                    icon: <TrendingUp className={value >= 0 ? 'text-blue-500' : 'text-danger'} />
                };
        }
    };

    const { textColor, bgColor, gradientClass, borderColor, icon } = getColorAndIcon();

    // 格式化金额
    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
        >
            <Card
                className={`overflow-hidden border ${borderColor}`}
                shadow="sm"
            >
                <div className={`absolute right-0 w-32 h-32 -top-16 rounded-full bg-gradient-to-br ${gradientClass} blur-3xl opacity-30`} />
                <CardBody className="p-6 relative">
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <p className="text-sm text-default-500 font-medium">{title}</p>
                            {description && (
                                <p className="text-xs text-default-400">{description}</p>
                            )}
                            {isLoading ? (
                                <div className="h-8 flex items-center">
                                    <Spinner size="sm" color={type === 'income' ? 'success' : type === 'expense' ? 'danger' : 'primary'} />
                                </div>
                            ) : (
                                <motion.h3
                                    className={`text-2xl font-bold ${textColor} mt-1`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    {formatAmount(value)}
                                </motion.h3>
                            )}
                        </div>
                        <motion.div
                            className={`${bgColor} p-3 rounded-full`}
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                            {icon}
                        </motion.div>
                    </div>

                    {/* 装饰线 */}
                    <div className="absolute bottom-0 left-0 w-full h-1 overflow-hidden">
                        <motion.div
                            className={`h-full ${textColor} opacity-30`}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1, delay: 0.4 }}
                        />
                    </div>
                </CardBody>
            </Card>
        </motion.div>
    );
} 