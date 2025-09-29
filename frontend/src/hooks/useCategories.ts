/*
 * @Author: Await
 * @Date: 2025-03-15 10:49:41
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:34:15
 * @Description: 请填写简介
 */
import { useState, useEffect, useRef } from 'react';
import { Category } from '@/lib/types';
import { fetchAPI } from '@/lib/api';
import { useAuth } from './useAuth';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useAuth();
    const requestAttempted = useRef(false);

    useEffect(() => {
        // 重置请求状态
        if (user) {
            requestAttempted.current = false;
        }

        const fetchCategories = async () => {
            // 如果已经请求过并失败，不再重复请求
            if (requestAttempted.current && error) {
                return;
            }

            try {
                setIsLoading(true);
                let url = '/categories';
                // 如果有用户并且有当前家庭ID，则获取家庭的分类
                if (user?.currentFamilyId) {
                    url += `?familyId=${user.currentFamilyId}`;
                } else if (user?.id) {
                    // 否则获取用户的个人分类
                    url += `?userId=${user.id}`;
                }
                const response = await fetchAPI<Category[]>(url);
                setCategories(response.data);
                setError(null);
            } catch (err) {
                console.error('获取分类失败', err);
                setError(err as Error);
                setCategories([]);
                // 标记已尝试请求
                requestAttempted.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchCategories();
        } else {
            setCategories([]);
            setIsLoading(false);
        }
    }, [user]);

    return { categories, isLoading, error };
} 