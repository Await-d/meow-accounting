import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { fetchAPI } from '@/lib/api';
import { CategoryStats, TimeRange } from '@/lib/types';
import { handleQueryError } from '@/lib/api';

export function useCategoryStats(
    timeRange: TimeRange = 'month',
    userId?: number,
    familyId?: number
) {
    const [data, setData] = useState<CategoryStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchCategoryStats = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                params.append('range', timeRange);
                if (userId) params.append('user_id', userId.toString());
                if (familyId) params.append('family_id', familyId.toString());

                const response = await fetchAPI<CategoryStats[]>(`/transactions/stats/category?${params.toString()}`);
                setData(response.data);
                setError(null);
            } catch (err) {
                console.error('获取分类统计数据失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取分类统计数据失败'), 'error');
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategoryStats();
    }, [timeRange, userId, familyId, showToast]);

    return { data, isLoading, error };
} 