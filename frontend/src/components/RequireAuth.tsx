/*
 * @Author: Await
 * @Date: 2025-03-09 20:23:12
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:13:34
 * @Description: 请填写简介
 */
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@nextui-org/react';
import React from 'react';

interface RequireAuthProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'owner';
}

export default function RequireAuth({ children, requiredRole }: RequireAuthProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [isChecking, setIsChecking] = React.useState(true);

    useEffect(() => {
        // 添加一个短暂延迟，给token验证一些时间
        const timer = setTimeout(() => {
            setIsChecking(false);

            if (!isLoading && !user) {
                router.push('/auth/login');
                return;
            }

            if (requiredRole && user && user.role !== requiredRole && user.role !== 'owner') {
                router.push('/dashboard');
            }
        }, 500); // 500ms延迟

        return () => clearTimeout(timer);
    }, [user, isLoading, router, requiredRole]);

    if (isLoading || isChecking) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'owner') {
        return null;
    }

    return <>{children}</>;
} 