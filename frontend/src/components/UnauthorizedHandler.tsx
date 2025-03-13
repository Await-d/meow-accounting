/*
 * @Author: Await
 * @Date: 2025-03-13 20:49:18
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:50:01
 * @Description: 请填写简介
 */
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { setGlobalUnauthorizedHandler, setGlobalToastHandler } from '@/lib/api';

/**
 * 用于处理全局未授权错误的组件
 * 必须放在 AuthProvider 内部使用
 */
export function UnauthorizedHandler() {
    const { handleUnauthorized } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        // 设置全局 API 未授权处理函数，使用 useAuth 的 handleUnauthorized 方法
        if (handleUnauthorized) {
            setGlobalUnauthorizedHandler(handleUnauthorized);
            console.log('已设置全局未授权处理函数');
        }

        // 设置全局 Toast 处理函数
        if (showToast) {
            setGlobalToastHandler(showToast);
            console.log('已设置全局Toast处理函数');
        }
    }, [handleUnauthorized, showToast]);

    return null; // 这是一个纯功能组件，不渲染任何内容
} 