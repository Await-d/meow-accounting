/*
 * @Author: Await
 * @Date: 2025-03-04 18:52:47
 * @LastEditors: Await
 * @LastEditTime: 2025-03-14 18:46:40
 * @Description: 请填写简介
 */
import type { Metadata, Viewport } from 'next';
// 使用系统字体以避免构建时网络问题
import './tailwind-generated.css';
import { Providers } from './providers';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/Toast';
import { RouteProvider } from '@/hooks/useRoute';
import { UnauthorizedHandler } from '@/components/UnauthorizedHandler';

export const metadata: Metadata = {
    title: '喵呜记账',
    description: '一个简单易用的个人记账应用',
    manifest: '/manifest.json',
    icons: {
        apple: [
            { url: '/icons/icon-192x192.png' },
            { url: '/icons/icon-512x512.png' },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: '喵呜记账',
    },
};

export const viewport: Viewport = {
    themeColor: '#000000',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN" suppressHydrationWarning className="dark">
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="msapplication-tap-highlight" content="no" />
                <meta name="theme-color" content="#000000" />
            </head>
            <body className="font-sans" suppressHydrationWarning>
                <Providers>
                    <ToastProvider>
                        <AuthProvider>
                            <RouteProvider>
                                <UnauthorizedHandler />
                                {children}
                            </RouteProvider>
                        </AuthProvider>
                    </ToastProvider>
                </Providers>
            </body>
        </html>
    );
} 
