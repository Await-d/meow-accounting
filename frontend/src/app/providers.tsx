/*
 * @Author: Await
 * @Date: 2025-03-04 18:53:01
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 21:59:39
 * @Description: 全局Provider组件，包含主题、状态管理、Toast等
 */
'use client';

import { NextUIProvider } from '@nextui-org/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5分钟后过期
                retry: 1, // 失败后重试1次
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <NextUIProvider>
                <NextThemesProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem={true}
                    value={{
                        light: "light",
                        dark: "dark"
                    }}
                >
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </NextThemesProvider>
            </NextUIProvider>
        </QueryClientProvider>
    );
} 