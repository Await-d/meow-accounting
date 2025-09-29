/*
 * @Author: Await
 * @Date: 2025-03-17 21:22:57
 * @LastEditors: Await
 * @LastEditTime: 2025-03-17 21:23:33
 * @Description: 请填写简介
 */
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { fetchAPI } from '@/lib/api';
import { Statistics } from '@/lib/types';
import { handleQueryError } from '@/lib/api';

export function useStatistics(
    timeRange: 'month' | 'quarter' | 'year' = 'month',
    userId?: number,
    familyId?: number
) {
    const [data, setData] = useState<Statistics>({
        total_income: 0,
        total_expense: 0,
        balance: 0,
        chart: [],
        details: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                params.append('range', timeRange);
                if (userId) params.append('user_id', userId.toString());
                if (familyId) params.append('family_id', familyId.toString());

                const response = await fetchAPI<Statistics>(`/transactions/stats?${params.toString()}`);
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error('获取统计数据失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取统计数据失败'), 'error');
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatistics();
    }, [timeRange, userId, familyId, showToast]);

    return { data, isLoading, error };
} 