/*
 * @Author: Await
 * @Date: 2025-03-09 20:23:12
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 20:43:32
 * @Description: 请填写简介
 */
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@nextui-org/react';

interface RequireAuthProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'owner';
}

export default function RequireAuth({ children, requiredRole }: RequireAuthProps) {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (requiredRole && user && user.role !== requiredRole && user.role !== 'owner') {
            router.push('/dashboard');
        }
    }, [user, isLoading, router, requiredRole]);

    if (isLoading) {
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