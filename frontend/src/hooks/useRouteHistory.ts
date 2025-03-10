/*
 * @Author: Await
 * @Date: 2025-03-10 19:46:36
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 19:47:56
 * @Description: 请填写简介
 */
import { useState, useCallback, useEffect } from 'react';
import { Route } from '@/lib/types';

const MAX_HISTORY_SIZE = 20;

export function useRouteHistory() {
    const [history, setHistory] = useState<Route[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // 添加路由到历史记录
    const addToHistory = useCallback((route: Route) => {
        setHistory(prev => {
            // 如果是当前路由，不添加到历史记录
            if (prev[currentIndex]?.path === route.path) {
                return prev;
            }

            // 移除当前位置之后的历史记录
            const newHistory = prev.slice(0, currentIndex + 1);

            // 添加新路由
            newHistory.push(route);

            // 如果历史记录超过最大长度，移除最早的记录
            if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.shift();
            }

            setCurrentIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [currentIndex]);

    // 后退
    const goBack = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            return history[currentIndex - 1];
        }
        return null;
    }, [history, currentIndex]);

    // 前进
    const goForward = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
            return history[currentIndex + 1];
        }
        return null;
    }, [history, currentIndex]);

    // 获取当前路由
    const getCurrentRoute = useCallback(() => {
        return history[currentIndex] || null;
    }, [history, currentIndex]);

    // 清除历史记录
    const clearHistory = useCallback(() => {
        setHistory([]);
        setCurrentIndex(-1);
    }, []);

    // 获取历史记录摘要
    const getHistorySummary = useCallback(() => {
        return {
            canGoBack: currentIndex > 0,
            canGoForward: currentIndex < history.length - 1,
            historyLength: history.length,
            currentIndex
        };
    }, [history.length, currentIndex]);

    return {
        addToHistory,
        goBack,
        goForward,
        getCurrentRoute,
        clearHistory,
        getHistorySummary
    };
} 