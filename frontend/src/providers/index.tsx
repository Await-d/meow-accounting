/*
 * @Author: Await
 * @Date: 2025-03-07 20:53:24
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:55:03
 * @Description: 请填写简介
 */
'use client';

import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false
        }
    }
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <NextUIProvider>
                <NextThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    themes={['light', 'dark']}
                >
                    {children}
                </NextThemeProvider>
            </NextUIProvider>
        </QueryClientProvider>
    );
} 