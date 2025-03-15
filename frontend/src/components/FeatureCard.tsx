import React from 'react';
import { Card } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
    className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    icon,
    gradient = 'primary',
    className
}) => {
    // 根据不同渐变类型定义渐变颜色
    const gradientClasses = {
        primary: 'from-primary-400 to-primary-600',
        success: 'from-success-400 to-success-600',
        warning: 'from-warning-400 to-warning-600',
        danger: 'from-danger-400 to-danger-600',
        secondary: 'from-secondary-400 to-secondary-600'
    };

    // 对应的高亮颜色
    const highlightClasses = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
        secondary: 'bg-secondary/10 text-secondary'
    };

    // 卡片悬停效果动画
    const hoverAnimation = {
        rest: {
            scale: 1,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05)'
        },
        hover: {
            scale: 1.03,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }
    };

    // 图标动画
    const iconAnimation = {
        rest: { scale: 1 },
        hover: { scale: 1.1, rotate: 5 }
    };

    return (
        <motion.div
            className={cn('w-full', className)}
            initial="rest"
            whileHover="hover"
            variants={hoverAnimation}
            transition={{ duration: 0.3 }}
        >
            <Card className="group overflow-hidden border border-default-100 p-6 h-full">
                <div className="relative z-10 flex flex-col h-full">
                    {/* 上方渐变装饰 */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-br opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                        style={{ background: `radial-gradient(circle, var(--${gradient}-500) 0%, transparent 70%)` }}
                    />

                    {/* 图标 */}
                    <motion.div
                        className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", highlightClasses[gradient])}
                        variants={iconAnimation}
                    >
                        {icon}
                    </motion.div>

                    {/* 内容 */}
                    <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-foreground/90">{title}</h3>
                    <p className="text-default-600 group-hover:text-default-700 transition-colors mt-auto">
                        {description}
                    </p>

                    {/* 底部装饰 */}
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-tr opacity-0 blur-3xl group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                        style={{ background: `radial-gradient(circle, var(--${gradient}-500) 0%, transparent 70%)` }}
                    />

                    {/* 角落装饰 */}
                    <div className="absolute top-0 right-0 h-12 w-12 overflow-hidden">
                        <div className={cn("absolute -top-6 -right-6 h-12 w-12 transform rotate-45 bg-gradient-to-r opacity-30", gradientClasses[gradient])} />
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default FeatureCard; 