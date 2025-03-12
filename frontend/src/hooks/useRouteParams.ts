/*
 * @Author: Await
 * @Date: 2025-03-10 21:06:18
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:36:02
 * @Description: 请填写简介
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { RouteParams } from '@/lib/types';

// 本地存储键
const STORAGE_KEY = 'route_params';

export function useRouteParams() {
    const [params, setParams] = useState<Record<string, RouteParams>>({});

    // 从localStorage加载数据
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setParams(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load route params:', error);
        }
    }, []);

    // 保存到本地存储
    const saveToStorage = useCallback((newParams: Record<string, RouteParams>) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newParams));
        } catch (error) {
            console.error('Failed to save route params:', error);
        }
    }, []);

    // 保存参数
    const saveParams = useCallback((path: string, newParams: RouteParams) => {
        setParams(prev => {
            const updated = {
                ...prev,
                [path]: newParams
            };
            saveToStorage(updated);
            return updated;
        });
    }, [saveToStorage]);

    // 获取参数
    const getParams = useCallback((path: string): RouteParams | undefined => {
        return params[path];
    }, [params]);

    // 清除参数
    const clearParams = useCallback((path?: string) => {
        if (path) {
            setParams(prev => {
                const { [path]: _, ...rest } = prev;
                saveToStorage(rest);
                return rest;
            });
        } else {
            setParams({});
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [saveToStorage]);

    return {
        saveParams,
        getParams,
        clearParams
    };
} 