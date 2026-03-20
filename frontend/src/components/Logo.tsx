import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    variant?: 'default' | 'small' | 'large';
    showText?: boolean;
    className?: string;
    linkTo?: string;
}

export default function Logo({
    variant = 'default',
    showText = true,
    className,
    linkTo = '/'
}: LogoProps) {
    const sizes = {
        small: 'w-8 h-8',
        default: 'w-10 h-10',
        large: 'w-16 h-16'
    };

    const iconSizes = {
        small: 32,
        default: 40,
        large: 64
    };

    const textSizes = {
        small: 'text-xl',
        default: 'text-2xl',
        large: 'text-3xl'
    };

    const logoContent = (
        <div className={cn('flex items-center gap-3', className)}>
            <Image
                src="/icons/icon-192x192.png"
                alt="喵呜记账"
                width={iconSizes[variant]}
                height={iconSizes[variant]}
                className={cn('rounded-lg shadow-sm', sizes[variant])}
            />
            {showText && (
                <div>
                    <h1 className={cn('font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent', textSizes[variant])}>
                        喵呜记账
                    </h1>
                    {variant === 'large' && (
                        <p className="text-sm text-default-500">
                            智能家庭财务管理工具
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    if (linkTo) {
        return (
            <Link href={linkTo} className="no-underline">
                {logoContent}
            </Link>
        );
    }

    return logoContent;
} 
