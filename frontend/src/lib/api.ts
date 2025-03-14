import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
    LoginData,
    RegisterData,
    AuthResponse,
    Transaction,
    CreateTransactionData,
    TransactionsResponse,
    TransactionFilter,
    Statistics,
    CategoryStats,
    Category,
    Family,
    FamilyMember,
    CreateFamilyData,
    AddFamilyMemberData,
    APIError,
    User,
    UserSettings,
    Route,
    CreateRouteData,
    UpdateRouteData,
    RouteStats,
    Invitation
} from './types';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useEffect, useMemo } from 'react';
import { useFamily } from '@/hooks/useFamily';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 全局处理未授权错误
let globalUnauthorizedHandler: (() => void) | null = null;

// 全局Toast处理函数，用于显示错误消息
let globalToastHandler: ((message: string, type: 'error' | 'warning' | 'success' | 'info') => void) | null = null;

// 设置全局未授权处理函数
export function setGlobalUnauthorizedHandler(handler: () => void) {
    globalUnauthorizedHandler = handler;
}

// 设置全局Toast处理函数
export function setGlobalToastHandler(handler: (message: string, type: 'error' | 'warning' | 'success' | 'info') => void) {
    globalToastHandler = handler;
}

// 显示全局Toast
function showGlobalToast(message: string, type: 'error' | 'warning' | 'success' | 'info' = 'error') {
    if (globalToastHandler) {
        globalToastHandler(message, type);
    } else {
        console[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'](message);
    }
}

// 状态码处理映射
const statusHandlers: Record<number, (message: string) => void> = {
    // 400: 请求参数错误
    400: (message) => {
        console.warn(`请求参数错误: ${message}`);
        showGlobalToast(`请求参数错误: ${message}`, 'warning');
    },
    // 401: 未授权，需要重新登录
    401: (_) => {
        console.warn('用户未授权或会话已过期，需要重新登录');
        // 清除 token
        removeToken();
        // 清除本地存储中的访客模式标记
        localStorage.removeItem('isGuest');
        // 清除其他可能的状态
        localStorage.removeItem('currentFamilyId');

        // 如果有设置全局处理函数，调用它
        if (globalUnauthorizedHandler) {
            globalUnauthorizedHandler();
        } else {
            // 如果没有全局处理函数，直接重定向到登录页
            showGlobalToast('登录已过期，请重新登录', 'error');
            window.location.href = '/auth/login';
        }
    },
    // 403: 禁止访问
    403: (message) => {
        console.warn(`无权访问: ${message}`);
        showGlobalToast(`无权访问: ${message}`, 'error');
    },
    // 404: 资源不存在
    404: (message) => {
        console.warn(`资源不存在: ${message}`);
        showGlobalToast(`资源不存在: ${message}`, 'warning');
    },
    // 422: 数据验证失败
    422: (message) => {
        console.warn(`数据验证失败: ${message}`);
        showGlobalToast(`数据验证失败: ${message}`, 'warning');
    },
    // 429: 请求过多
    429: (message) => {
        console.warn(`请求过多，请稍后再试: ${message}`);
        showGlobalToast('请求过多，请稍后再试', 'warning');
    },
    // 500: 服务器错误
    500: (message) => {
        console.error(`服务器错误: ${message}`);
        showGlobalToast(`服务器内部错误，请稍后再试: ${message}`, 'error');
    },
    // 502: 网关错误
    502: (message) => {
        console.error(`网关错误: ${message}`);
        showGlobalToast('服务器网关错误，请稍后再试', 'error');
    },
    // 503: 服务不可用
    503: (message) => {
        console.error(`服务不可用: ${message}`);
        showGlobalToast('服务暂时不可用，请稍后再试', 'error');
    },
    // 504: 网关超时
    504: (message) => {
        console.error(`网关超时: ${message}`);
        showGlobalToast('请求超时，请检查网络连接后重试', 'error');
    }
};

// 通用请求函数
export async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const baseURL = API_BASE_URL;
    const url = endpoint.startsWith('/')
        ? `${baseURL}${endpoint}`
        : `${baseURL}/${endpoint}`;

    console.log(`API请求: ${options.method || 'GET'} ${url}`);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    // 尝试多次获取token，解决token加载时机问题
    let token = getToken();
    if (!token) {
        console.log('Token未找到，等待100ms后重试');
        await new Promise(resolve => setTimeout(resolve, 100));
        token = getToken();
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn('无法获取认证Token');
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        console.log(`API响应状态: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            let errorMessage = `请求失败: ${response.status} ${response.statusText}`;
            let errorData: any = null;

            try {
                errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                console.error('API错误详情:', errorData);
            } catch (e) {
                // 无法解析JSON错误
            }

            // 处理特定状态码
            const statusHandler = statusHandlers[response.status];
            if (statusHandler) {
                statusHandler(errorMessage);
            }

            throw new APIError(response.status, errorMessage);
        }

        // 对于204 No Content响应，直接返回null
        if (response.status === 204) {
            return null as T;
        }

        const data = await response.json();
        console.log('API响应数据:', data);
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        console.error('API请求异常:', error);
        throw new APIError(500, error instanceof Error ? error.message : '未知错误');
    }
}

export type { Transaction, TransactionFilter };

// 在 React Query 中通用的错误处理
export const handleQueryError = (error: any, fallbackMessage = '请求失败') => {
    if (error instanceof APIError) {
        // 状态码已在 fetchAPI 中被处理，这里主要处理界面提示
        switch (error.status) {
            case 400:
                return `请求参数错误: ${error.message}`;
            case 403:
                return `无权访问: ${error.message}`;
            case 404:
                return `资源不存在: ${error.message}`;
            case 429:
                return '请求过于频繁，请稍后再试';
            case 500:
            case 502:
            case 503:
                return `服务器错误: ${error.message}`;
            default:
                return error.message || fallbackMessage;
        }
    }
    return error?.message || fallbackMessage;
};

// 交易记录相关API
export function useTransactions(filter: TransactionFilter = {}, page: number = 1, limit: number = 20) {
    const { user } = useAuth();
    const familyId = user?.currentFamilyId;
    const { showToast } = useToast();

    const queryString = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        family_id: familyId?.toString() || '',
        ...(filter.startDate && { startDate: filter.startDate }),
        ...(filter.endDate && { endDate: filter.endDate }),
        ...(filter.type && { type: filter.type }),
        ...(filter.categoryId && { categoryId: filter.categoryId.toString() }),
        ...(filter.minAmount && { minAmount: filter.minAmount.toString() }),
        ...(filter.maxAmount && { maxAmount: filter.maxAmount.toString() }),
    }).toString();

    const query = useInfiniteQuery({
        queryKey: ['transactions', JSON.stringify(filter), limit],
        queryFn: async ({ pageParam = page }) => {
            try {
                return await fetchAPI<TransactionsResponse>(`/transactions?${queryString}`);
            } catch (error: any) {
                showToast(handleQueryError(error, '获取交易记录失败'), 'error');
                throw error;
            }
        },
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.page + 1 : undefined,
        initialPageParam: page,
        staleTime: 30 * 1000, // 30秒后过期
        gcTime: 5 * 60 * 1000, // 5分钟后进行垃圾回收
        refetchOnWindowFocus: false,
        retry: false, // 禁用自动重试
        enabled: !!familyId, // 只有在有familyId时才启用查询
    });

    return query;
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

export const deleteTransaction = async (id: number) => {
    return await fetchAPI(`/api/transactions/${id}`, {
        method: 'DELETE',
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
            showToast('删除成功', 'success');
        },
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else {
                showToast('删除失败', 'error');
            }
        },
    });
};

// 统计相关API
export function useStatistics(timeRange: 'month' | 'quarter' | 'year' = 'month') {
    const { user } = useAuth();
    const familyId = user?.currentFamilyId;
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
        queryKey: ['statistics', timeRange, familyId],
        queryFn: () =>
            fetchAPI<Statistics>(`/transactions/stats?startDate=${startDate}&endDate=${endDate}&family_id=${familyId}`),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: !!familyId,
    });
}

// 分类统计相关API
export function useCategoryStats(timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const { user } = useAuth();
    const familyId = user?.currentFamilyId;

    return useQuery({
        queryKey: ['categoryStats', timeRange, familyId],
        queryFn: () => fetchAPI<CategoryStats[]>(`/transactions/stats/category?range=${timeRange}&family_id=${familyId}`),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: !!familyId,
    });
}

// 分类相关API
export function useCategories() {
    const { user } = useAuth();
    const { currentFamily, families = [] } = useFamily();
    const familyId = currentFamily?.id;
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    console.log('useCategories hook called, familyId:', familyId, 'user:', user, 'currentFamily:', currentFamily);

    // 获取默认分类
    const {
        data: defaultCategories,
        isLoading: isLoadingDefault,
        error: defaultError,
        refetch: refetchDefault
    } = useQuery({
        queryKey: ['defaultCategories'],
        queryFn: async () => {
            try {
                // 获取默认分类
                console.log('获取默认分类列表');
                const result = await fetchAPI<Category[]>(`/categories/default`);
                console.log('获取默认分类结果:', result);
                return result;
            } catch (error) {
                console.error('获取默认分类失败:', error);
                throw error;
            }
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 3,
        enabled: !!user, // 只要用户已登录就启用查询
    });

    // 获取自定义分类
    const {
        data: customCategories,
        isLoading: isLoadingCustom,
        error: customError,
        refetch: refetchCustom
    } = useQuery({
        queryKey: ['customCategories', familyId],
        queryFn: async () => {
            if (!familyId) {
                // 如果没有选择家庭，返回空数组
                console.log('没有选择家庭，返回空自定义分类数组');
                return [];
            }
            try {
                // 获取自定义分类
                console.log('获取家庭自定义分类列表:', `/categories/${familyId}/custom`);
                const result = await fetchAPI<Category[]>(`/categories/${familyId}/custom`);
                console.log('获取自定义分类结果:', result);
                return result;
            } catch (error) {
                console.error('获取自定义分类失败:', error);
                throw error;
            }
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 3,
        enabled: !!user, // 只要用户已登录就启用查询
    });

    // 合并默认分类和自定义分类
    const data = useMemo(() => {
        const defaults = defaultCategories || [];
        const customs = customCategories || [];
        return [...defaults, ...customs];
    }, [defaultCategories, customCategories]);

    // 返回数据和加载状态
    return {
        categories: data,
        defaultCategories: defaultCategories || [],
        customCategories: customCategories || [],
        isLoading: isLoadingDefault || isLoadingCustom,
        error: defaultError || customError,
        refetch: () => {
            refetchDefault();
            if (familyId) {
                refetchCustom();
            }
        }
    };
}

// 创建分类
export function useCreateCategory() {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const familyId = currentFamily?.id;
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (data: {
            name: string;
            icon: string;
            type: 'income' | 'expense';
            is_default?: boolean;
        }) => {
            // 如果是创建默认分类，不需要家庭ID
            if (data.is_default) {
                console.log('创建默认分类:', '/categories', data);
                return await fetchAPI<Category>('/categories', {
                    method: 'POST',
                    body: JSON.stringify({
                        ...data,
                        isDefault: true
                    }),
                });
            }

            // 创建自定义分类需要家庭ID
            if (!familyId) {
                throw new Error('请先选择一个家庭');
            }
            console.log('创建分类:', '/categories', { ...data, family_id: familyId });
            return await fetchAPI<Category>('/categories', {
                method: 'POST',
                body: JSON.stringify({
                    ...data,
                    family_id: familyId,
                    is_default: false
                }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', familyId] });
            queryClient.invalidateQueries({ queryKey: ['customCategories', familyId] });
            queryClient.invalidateQueries({ queryKey: ['defaultCategories'] });
            showToast('创建成功', 'success');
        },
        onError: (error: any) => {
            console.error('创建分类失败:', error);
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else if (error.status === 403) {
                showToast('无权限创建分类', 'error');
            } else if (error.message) {
                showToast(error.message, 'error');
            } else {
                showToast('创建失败', 'error');
            }
        },
    });
}

// 更新分类
export function useUpdateCategory() {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const familyId = currentFamily?.id;
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (data: Category) => {
            // 如果是默认分类，不需要家庭ID
            if (data.is_default) {
                console.log('更新默认分类:', `/categories/${data.id}`);
                return await fetchAPI<Category>(`/categories/${data.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            }

            // 如果是自定义分类，需要家庭ID
            if (!familyId) {
                throw new Error('请先选择一个家庭');
            }
            console.log('更新自定义分类:', `/categories/${familyId}/${data.id}`);
            return await fetchAPI<Category>(`/categories/${familyId}/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', familyId] });
            queryClient.invalidateQueries({ queryKey: ['customCategories', familyId] });
            queryClient.invalidateQueries({ queryKey: ['defaultCategories'] });
            showToast('更新成功', 'success');
        },
        onError: (error: any) => {
            console.error('更新分类失败:', error);
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else if (error.status === 403) {
                showToast('无权限修改此分类', 'error');
            } else if (error.message) {
                showToast(error.message, 'error');
            } else {
                showToast('更新失败', 'error');
            }
        },
    });
}

// 删除分类
export function useDeleteCategory() {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const familyId = currentFamily?.id;
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (category: Category) => {
            // 如果是默认分类，不需要家庭ID
            if (category.is_default) {
                console.log('删除默认分类:', `/categories/${category.id}`);
                return await fetchAPI(`/categories/${category.id}`, {
                    method: 'DELETE',
                });
            }

            // 如果是自定义分类，需要家庭ID
            if (!familyId) {
                throw new Error('请先选择一个家庭');
            }
            console.log('删除自定义分类:', `/categories/${familyId}/${category.id}`);
            return await fetchAPI(`/categories/${familyId}/${category.id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories', familyId] });
            queryClient.invalidateQueries({ queryKey: ['customCategories', familyId] });
            queryClient.invalidateQueries({ queryKey: ['defaultCategories'] });
            showToast('删除成功', 'success');
        },
        onError: (error: any) => {
            console.error('删除分类失败:', error);
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else if (error.status === 403) {
                showToast('无权限删除此分类', 'error');
            } else if (error.message) {
                showToast(error.message, 'error');
            } else {
                showToast('删除失败', 'error');
            }
        },
    });
}

// 用户注册
export async function register(data: RegisterData): Promise<AuthResponse> {
    return fetchAPI<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// 用户登录
export async function login(data: LoginData): Promise<AuthResponse> {
    return fetchAPI<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// 家庭相关类型
export function useCreateFamily() {
    return useMutation({
        mutationFn: (data: CreateFamilyData) =>
            fetchAPI<{ id: number }>('/families', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
    });
}

export function getUserFamilies() {
    return fetchAPI<Family[]>('/families/user');
}

export function getFamilyById(id: number) {
    return fetchAPI<Family>(`/families/${id}`);
}

export function getFamilyMembers(familyId: number) {
    return fetchAPI<FamilyMember[]>(`/families/${familyId}/members`);
}

export function addFamilyMember(familyId: number, data: AddFamilyMemberData) {
    return fetchAPI<void>(`/families/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export function updateMemberRole(familyId: number, userId: number, role: 'admin' | 'member') {
    return fetchAPI<void>(`/families/${familyId}/members/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    });
}

export function removeFamilyMember(familyId: number, userId: number) {
    return fetchAPI<void>(`/families/${familyId}/members/${userId}`, {
        method: 'DELETE'
    });
}

// 通过邮箱查找用户
export function findUserByEmail(email: string) {
    return fetchAPI<{ id: number; username: string; email: string }>(
        `/users/search?email=${encodeURIComponent(email)}`
    );
}

// 用户相关
export function updateProfile(username: string) {
    return fetchAPI('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ username })
    });
}

// 修改密码
export function changePassword(currentPassword: string, newPassword: string) {
    return fetchAPI('/users/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
    });
}

// 更新隐私设置
export function updatePrivacySettings(privacy_mode: boolean, guest_password?: string) {
    return fetchAPI('/users/privacy', {
        method: 'PUT',
        body: JSON.stringify({ privacy_mode, guest_password })
    });
}

// 验证访客密码
export function verifyGuestPassword(password: string) {
    return fetchAPI<{ success: boolean }>('/users/verify-guest', {
        method: 'POST',
        body: JSON.stringify({ password }),
    });
}

// 隐私设置相关API
export function useUpdatePrivacySettings() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: { privacy_mode: boolean; guest_password?: string }) =>
            fetchAPI('/users/privacy', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else {
                showToast('更新失败', 'error');
            }
        },
    });
}

// 个人资料相关API
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: { username: string; email: string }) =>
            fetchAPI<User>('/users/profile', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else {
                showToast('更新失败', 'error');
            }
        },
    });
}

export function useChangePassword() {
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: { old_password: string; new_password: string }) =>
            fetchAPI('/users/password', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else if (error.status === 400) {
                showToast('当前密码错误', 'error');
            } else {
                showToast('修改失败', 'error');
            }
        },
    });
}

export function useImportTransactions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (formData: FormData) =>
            fetchAPI<{ count: number }>('/transactions/import', {
                method: 'POST',
                body: formData,
                headers: {}, // 让浏览器自动设置 Content-Type
            }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
            showToast(`成功导入 ${data.count} 条交易记录`, 'success');
        },
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else {
                showToast('导入失败', 'error');
            }
        },
    });
}

// 导出交易记录
export function useExportTransactions() {
    const { user } = useAuth();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (data: { startDate?: string; endDate?: string }) => {
            const queryString = new URLSearchParams({
                family_id: user?.currentFamilyId?.toString() || '',
                ...(data.startDate && { startDate: data.startDate }),
                ...(data.endDate && { endDate: data.endDate }),
            }).toString();

            const response = await fetch(`${API_BASE_URL}/transactions/export?${queryString}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            if (!response.ok) {
                throw new APIError(response.status, response.statusText || '导出失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions-${dayjs().format('YYYY-MM-DD')}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        },
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else {
                showToast('导出失败', 'error');
            }
        },
    });
}

// 更新用户设置
export async function updateUserSettings(settings: UserSettings): Promise<User> {
    const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(settings)
    });

    if (!response.ok) {
        throw new APIError(response.status, await response.text());
    }

    return response.json();
}

// 路由管理API
export async function getAllRoutes() {
    const response = await fetchAPI<{ personalRoutes: Route[]; familyRoutes: Route[] }>('/routes/all');
    return response;
}

export async function createRoute(data: CreateRouteData) {
    const response = await fetchAPI<Route>('/routes', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response;
}

export async function updateRoute({ id, data }: { id: number; data: UpdateRouteData }) {
    const response = await fetchAPI<Route>(`/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response;
}

export async function deleteRoute(id: number) {
    const response = await fetchAPI<void>(`/routes/${id}`, {
        method: 'DELETE'
    });
    return response;
}

export async function toggleRouteActive(id: number) {
    const response = await fetchAPI<Route>(`/routes/${id}/toggle`, {
        method: 'PUT'
    });
    return response;
}

export async function getRouteStats(id: number) {
    const response = await fetchAPI<RouteStats>(`/routes/stats/report/${id}`);
    return response;
}

// 用户管理API
export async function getAllUsers() {
    try {
        console.log('获取所有用户列表');
        const response = await fetchAPI<User[]>('/users/all');
        return response;
    } catch (error) {
        console.error('获取所有用户失败:', error);
        throw error;
    }
}

// 添加对应的React Query hook
export function useAllUsers() {
    const { showToast } = useToast();

    return useQuery({
        queryKey: ['allUsers'],
        queryFn: async () => {
            try {
                return await getAllUsers();
            } catch (error: any) {
                showToast(handleQueryError(error, '获取用户列表失败'), 'error');
                throw error;
            }
        },
        staleTime: 30 * 1000, // 30秒内数据不过期
        gcTime: 5 * 60 * 1000, // 5分钟后垃圾回收
        refetchOnWindowFocus: false,
        retry: 1, // 失败后重试一次
    });
}

export async function updateUser({ id, data }: { id: number, data: Partial<User> }) {
    const response = await fetchAPI<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response;
}

export async function deleteUser(id: number) {
    const response = await fetchAPI<void>(`/users/${id}`, {
        method: 'DELETE'
    });
    return response;
}

export async function freezeUser(id: number) {
    const response = await fetchAPI<User>(`/users/${id}/freeze`, {
        method: 'PUT'
    });
    return response;
}

export async function unfreezeUser(id: number) {
    const response = await fetchAPI<User>(`/users/${id}/unfreeze`, {
        method: 'PUT'
    });
    return response;
}

// 获取家庭邀请
export async function getFamilyInvitations(familyId: number) {
    return fetchAPI<Invitation[]>(`/families/${familyId}/invitations`);
}

// 邀请成员
export async function inviteMember(familyId: number, data: { email: string; role: 'admin' | 'member' }) {
    return fetchAPI<void>(`/families/${familyId}/invite`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// 取消邀请
export async function cancelInvitation(familyId: number, invitationId: number) {
    return fetchAPI<void>(`/families/${familyId}/invitations/${invitationId}`, {
        method: 'DELETE'
    });
}