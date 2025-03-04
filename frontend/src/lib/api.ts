import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// API错误类
export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

// 通用请求函数
async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new APIError(
            response.status,
            response.statusText || '请求失败'
        );
    }

    return response.json();
}

// 交易记录相关API
export interface Transaction {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    category_name: string;
    category_icon: string;
    description: string;
    date: string;
}

interface TransactionsResponse {
    data: Transaction[];
    total: number;
    hasMore: boolean;
}

export function useTransactions(page: number = 1, limit: number = 20) {
    return useInfiniteQuery({
        queryKey: ['transactions', limit],
        queryFn: ({ pageParam = page }) =>
            fetchAPI<TransactionsResponse>(`/transactions?page=${pageParam}&limit=${limit}`),
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasMore ? allPages.length + 1 : undefined,
        initialPageParam: page,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transaction: Omit<Transaction, 'id'>) =>
            fetchAPI<Transaction>('/transactions', {
                method: 'POST',
                body: JSON.stringify(transaction),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
        },
    });
}

// 统计相关API
export interface Statistics {
    summary: {
        totalIncome: number;
        totalExpense: number;
    };
    details: {
        type: 'income' | 'expense';
        category_name: string;
        category_icon: string;
        total_amount: number;
        transaction_count: number;
    }[];
}

export function useStatistics() {
    const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD');

    return useQuery({
        queryKey: ['statistics', startDate, endDate],
        queryFn: () =>
            fetchAPI<Statistics>(`/statistics?startDate=${startDate}&endDate=${endDate}`),
        staleTime: 5 * 60 * 1000, // 5分钟后过期
    });
}

// 分类统计相关API
export interface CategoryStats {
    name: string;
    amount: number;
    percentage: number;
    trend: number[];
}

export function useCategoryStats(timeRange: 'week' | 'month' | 'quarter' | 'year') {
    return useQuery({
        queryKey: ['categoryStats', timeRange],
        queryFn: () => fetchAPI<CategoryStats[]>(`/statistics/categories?range=${timeRange}`),
        staleTime: 5 * 60 * 1000, // 5分钟后过期
    });
}

// 分类相关API
export interface Category {
    id: number;
    name: string;
    icon: string;
    type: 'income' | 'expense';
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchAPI<Category[]>('/categories'),
        staleTime: 30 * 60 * 1000, // 30分钟后过期
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (category: Omit<Category, 'id'>) =>
            fetchAPI<Category>('/categories', {
                method: 'POST',
                body: JSON.stringify(category),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
} 