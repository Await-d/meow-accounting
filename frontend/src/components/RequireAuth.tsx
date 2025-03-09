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