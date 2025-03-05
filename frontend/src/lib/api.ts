import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { LoginData, RegisterData, AuthResponse } from './types';
import { getToken } from '@/utils/auth';

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
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
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
    type: 'income' | 'expense';
    amount: number;
    category_id: number;
    category_name: string;
    category_icon: string;
    description: string;
    date: string;
}

export type CreateTransactionData = Omit<Transaction, 'id'>;

interface TransactionsResponse {
    data: Transaction[];
    total: number;
    hasMore: boolean;
}

export interface TransactionFilter {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    categoryId?: number;
    minAmount?: number;
    maxAmount?: number;
}

export function useTransactions(filter: TransactionFilter = {}, page: number = 1, limit: number = 20) {
    const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filter.startDate && { startDate: filter.startDate }),
        ...(filter.endDate && { endDate: filter.endDate }),
        ...(filter.type && { type: filter.type }),
        ...(filter.categoryId && { categoryId: filter.categoryId.toString() }),
        ...(filter.minAmount && { minAmount: filter.minAmount.toString() }),
        ...(filter.maxAmount && { maxAmount: filter.maxAmount.toString() }),
    }).toString();

    return useInfiniteQuery({
        queryKey: ['transactions', filter, limit],
        queryFn: ({ pageParam = page }) =>
            fetchAPI<TransactionsResponse>(`/transactions?${queryString}`),
        getNextPageParam: (lastPage, allPages) =>
            lastPage.hasMore ? allPages.length + 1 : undefined,
        initialPageParam: page,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transaction: CreateTransactionData) =>
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

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (transaction: Transaction) =>
            fetchAPI<Transaction>(`/transactions/${transaction.id}`, {
                method: 'PUT',
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

export function useStatistics(timeRange: 'month' | 'quarter' | 'year' = 'month') {
    const now = dayjs();
    let startDate: string;
    let endDate = now.format('YYYY-MM-DD');

    switch (timeRange) {
        case 'quarter':
            const quarterStart = Math.floor(now.month() / 3) * 3;
            startDate = now.month(quarterStart).startOf('month').format('YYYY-MM-DD');
            break;
        case 'year':
            startDate = now.startOf('year').format('YYYY-MM-DD');
            break;
        case 'month':
        default:
            startDate = now.startOf('month').format('YYYY-MM-DD');
    }

    return useQuery({
        queryKey: ['statistics', timeRange],
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

export function useCategoryStats(timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month') {
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

// 用户注册
export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '注册失败');
    }

    return response.json();
}

// 用户登录
export async function login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '登录失败');
    }

    return response.json();
}

// 家庭相关类型
export interface Family {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
}

export interface FamilyMember {
    id: number;
    family_id: number;
    user_id: number;
    role: 'owner' | 'admin' | 'member';
    created_at: string;
    username: string;
    email: string;
}

export interface CreateFamilyData {
    name: string;
    description: string;
}

export interface AddFamilyMemberData {
    userId: number;
    role: 'admin' | 'member';
}

// 家庭相关 API
export async function createFamily(data: CreateFamilyData): Promise<{ id: number }> {
    return fetchAPI<{ id: number }>('/families', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function getUserFamilies(): Promise<Family[]> {
    return fetchAPI<Family[]>('/families/user');
}

export async function getFamilyById(id: number): Promise<Family> {
    return fetchAPI<Family>(`/families/${id}`);
}

export async function getFamilyMembers(familyId: number): Promise<FamilyMember[]> {
    return fetchAPI<FamilyMember[]>(`/families/${familyId}/members`);
}

export async function addFamilyMember(familyId: number, data: AddFamilyMemberData): Promise<void> {
    return fetchAPI<void>(`/families/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateMemberRole(familyId: number, userId: number, role: 'admin' | 'member'): Promise<void> {
    return fetchAPI<void>(`/families/${familyId}/members/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
}

export async function removeFamilyMember(familyId: number, userId: number): Promise<void> {
    return fetchAPI<void>(`/families/${familyId}/members/${userId}`, {
        method: 'DELETE'
    });
}

// 通过邮箱查找用户
export async function findUserByEmail(email: string): Promise<{ id: number; username: string; email: string }> {
    return fetchAPI<{ id: number; username: string; email: string }>(
        `/users/search?email=${encodeURIComponent(email)}`
    );
}