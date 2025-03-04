/*
 * @Author: Await
 * @Date: 2025-03-04 19:42:15
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:50:03
 * @Description: 主题切换组件
 */
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@nextui-org/react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function ThemeSwitch() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // 等待客户端挂载，避免服务端渲染不匹配
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Button
            isIconOnly
            variant="light"
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="切换主题"
        >
            {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
            ) : (
                <MoonIcon className="h-5 w-5" />
            )}
        </Button>
    );
} 