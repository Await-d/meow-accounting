/*
 * @Author: Await
 * @Date: 2025-03-15 10:49:41
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:34:15
 * @Description: 请填写简介
 */
import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/lib/types';
import { fetchAPI } from '@/lib/api';
import { useAuth } from './useAuth';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useAuth();

    const fetchCategories = useCallback(async () => {
        if (!user) {
            setCategories([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            let url = '/categories';
            if (user.currentFamilyId) {
                url += `?familyId=${user.currentFamilyId}`;
            } else if (user.id) {
                url += `?userId=${user.id}`;
            }

            const response = await fetchAPI<Category[]>(url);
            setCategories(response.data);
            setError(null);
        } catch (err) {
            console.error('获取分类失败', err);
            setError(err as Error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        isLoading,
        error,
        refetch: fetchCategories,
    };
}
