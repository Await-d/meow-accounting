/*
 * @Author: Await
 * @Date: 2025-03-05 20:41:03
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 19:48:45
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

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    // 页面切换动画
    const pageTransition = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
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
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    {children}
                </motion.div>
            </Suspense>
        </ErrorBoundary>
    );
} 