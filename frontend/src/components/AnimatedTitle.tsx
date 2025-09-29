import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedTitleProps {
    title: string;
    subtitle?: string;
    className?: string;
    align?: 'left' | 'center' | 'right';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    withUnderline?: boolean;
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
    title,
    subtitle,
    className,
    align = 'left',
    size = 'lg',
    withUnderline = false
}) => {
    // 文字大小类名
    const titleSizes = {
        sm: 'text-xl md:text-2xl',
        md: 'text-2xl md:text-3xl',
        lg: 'text-3xl md:text-4xl',
        xl: 'text-4xl md:text-5xl'
    };

    // 副标题大小类名
    const subtitleSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    // 对齐方式
    const alignClass = {
        left: 'text-left',
        center: 'text-center mx-auto',
        right: 'text-right ml-auto'
    };

    // 将标题拆分为单个字符数组用于动画
    const titleChars = title.split('');

    // 字符动画变体
    const charVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1] as any
            }
        })
    };

    // 副标题动画变体
    const subtitleVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                delay: titleChars.length * 0.05 + 0.2,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1] as any
            }
        }
    };

    // 下划线动画变体
    const underlineVariants = {
        hidden: { width: '0%', opacity: 0 },
        visible: {
            width: '100%',
            opacity: 1,
            transition: {
                delay: titleChars.length * 0.05 + 0.1,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1] as any
            }
        }
    };

    return (
        <div className={cn('overflow-hidden', alignClass[align], className)}>
            <h2 className={cn('font-bold leading-tight tracking-tight', titleSizes[size])}>
                <span className="sr-only">{title}</span>
                <span aria-hidden="true" className="block relative">
                    {titleChars.map((char, index) => (
                        <motion.span
                            key={`${char}-${index}`}
                            custom={index}
                            variants={charVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className={cn(
                                "inline-block bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent",
                                char === ' ' ? 'mx-1.5' : ''
                            )}
                        >
                            {char}
                        </motion.span>
                    ))}
                </span>
            </h2>

            {withUnderline && (
                <motion.div
                    className="h-[3px] bg-gradient-to-r from-primary via-secondary to-primary rounded-full mt-2"
                    variants={underlineVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                />
            )}

            {subtitle && (
                <motion.p
                    className={cn('mt-4 text-default-600', subtitleSizes[size])}
                    variants={subtitleVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
};

export default AnimatedTitle; 