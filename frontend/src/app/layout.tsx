/*
 * @Author: Await
 * @Date: 2025-03-04 18:52:47
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:53:33
 * @Description: 请填写简介
 */
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/Toast';
import { RouteProvider } from '@/hooks/useRoute';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

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
            <body className={inter.className}>
                <ToastProvider>
                    <Providers>
                        <AuthProvider>
                            <RouteProvider>
                                {children}
                                <Toaster richColors position="top-right" />
                            </RouteProvider>
                        </AuthProvider>
                    </Providers>
                </ToastProvider>
            </body>
        </html>
    );
} 