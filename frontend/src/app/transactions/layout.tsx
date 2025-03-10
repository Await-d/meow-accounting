/*
 * @Author: Await
 * @Date: 2025-03-10 19:44:17
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 19:44:48
 * @Description: 请填写简介
 */
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense } from 'react';
import { Spinner } from '@nextui-org/react';

export default function TransactionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    // 页面切换动画
    const pageTransition = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <ErrorBoundary>
            <Suspense fallback={
                <div className="flex justify-center items-center h-screen">
                    <Spinner size="lg" />
                </div>
            }>
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageTransition}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </Suspense>
        </ErrorBoundary>
    );
} 