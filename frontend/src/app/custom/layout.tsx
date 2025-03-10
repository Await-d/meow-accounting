/*
 * @Author: Await
 * @Date: 2025-03-10 20:08:38
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 20:08:56
 * @Description: 请填写简介
 */
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense } from 'react';
import { Spinner } from '@nextui-org/react';

export default function CustomLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </Suspense>
        </ErrorBoundary>
    );
} 