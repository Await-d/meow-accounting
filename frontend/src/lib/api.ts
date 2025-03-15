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
    Invitation,
    Account,
    Member,
    Bill
} from './types';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useEffect, useMemo, useState, useRef } from 'react';
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
        // console.warn('用户未授权或会话已过期，需要重新登录');
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
            //判断是否时登陆页面
            if (window.location.pathname !== '/auth/login') {
                showGlobalToast('登录已过期，请重新登录' + window.location.pathname, 'error');
                window.location.href = '/auth/login';
            }
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
    let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // 如果URL中包含transactions相关请求，但不包含familyId，则从localStorage中获取
    if ((url.includes('/transactions') || url.includes('/statistics') || url.includes('/categories')) &&
        !url.includes('families/') && !options.body) {
        const currentFamilyId = localStorage.getItem('currentFamilyId');
        if (currentFamilyId) {
            // 添加家庭ID到URL查询参数
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}familyId=${currentFamilyId}`;
        }
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const token = getToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

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

// 账单钩子
export function useBills(familyId?: string | number) {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();
    const requestAttempted = useRef(false);
    const hasError = useRef(false);

    useEffect(() => {
        // 当familyId变更时重置请求状态
        if (familyId) {
            requestAttempted.current = false;
            hasError.current = false;
        }

        const fetchBills = async () => {
            if (!familyId) {
                setBills([]);
                setIsLoading(false);
                return;
            }

            // 如果已经请求过并失败，不再重复请求
            if (requestAttempted.current && hasError.current) {
                return;
            }

            try {
                setIsLoading(true);
                requestAttempted.current = true; // 标记已尝试，放在请求前避免重复请求

                const url = `/families/${familyId}/bills`;
                const data = await fetchAPI<Bill[]>(url);
                setBills(data);
                setError(null);
                hasError.current = false;
            } catch (err) {
                console.error('获取账单失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取账单失败'), 'error');
                setError(err as Error);
                setBills([]);
                hasError.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        // 仅在未处于错误状态或familyId变更时执行请求
        if (familyId && (!requestAttempted.current || !hasError.current)) {
            fetchBills();
        } else if (!familyId) {
            setBills([]);
            setIsLoading(false);
        }
    }, [familyId]); // 移除showToast依赖，避免不必要的重新渲染

    return { bills, isLoading, error };
}

// 交易记录钩子
export function useTransactions(familyId?: string | number) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();
    const requestAttempted = useRef(false);
    const hasError = useRef(false);

    useEffect(() => {
        // 当familyId变更时重置请求状态
        if (familyId) {
            requestAttempted.current = false;
            hasError.current = false;
        }

        const fetchTransactions = async () => {
            if (!familyId) {
                setTransactions([]);
                setIsLoading(false);
                return;
            }

            // 如果已经请求过并失败，不再重复请求
            if (requestAttempted.current && hasError.current) {
                return;
            }

            try {
                setIsLoading(true);
                requestAttempted.current = true; // 在请求前标记，避免重复请求

                const url = `/families/${familyId}/transactions`;
                const data = await fetchAPI<Transaction[]>(url);
                setTransactions(data);
                setError(null);
                hasError.current = false;
            } catch (err) {
                console.error('获取交易记录失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取交易记录失败'), 'error');
                setError(err as Error);
                setTransactions([]); // 设置空数组避免组件报错
                hasError.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        // 仅在未处于错误状态或familyId变更时执行请求
        if (familyId && (!requestAttempted.current || !hasError.current)) {
            fetchTransactions();
        } else if (!familyId) {
            setTransactions([]);
            setIsLoading(false);
        }
    }, [familyId]); // 移除showToast，避免不必要的重新渲染

    return { transactions, isLoading, error };
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    // 使用useRef防止更新处理函数在每次渲染时创建新实例
    const successHandler = useRef(() => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['statistics'] });
        showToast && showToast('创建成功', 'success');
    }).current;

    return useMutation({
        mutationFn: (transaction: CreateTransactionData) =>
            fetchAPI<Transaction>('/transactions', {
                method: 'POST',
                body: JSON.stringify(transaction),
            }),
        onSuccess: successHandler,
        onError: (error: any) => {
            console.error('创建交易失败:', error);
            showToast && showToast(handleQueryError(error, '创建交易失败'), 'error');
        }
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    // 使用useRef防止更新处理函数在每次渲染时创建新实例
    const successHandler = useRef(() => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['statistics'] });
        showToast && showToast('更新成功', 'success');
    }).current;

    return useMutation({
        mutationFn: (transaction: Transaction) =>
            fetchAPI<Transaction>(`/transactions/${transaction.id}`, {
                method: 'PUT',
                body: JSON.stringify(transaction),
            }),
        onSuccess: successHandler,
        onError: (error: any) => {
            console.error('更新交易失败:', error);
            showToast && showToast(handleQueryError(error, '更新交易失败'), 'error');
        }
    });
}

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (id: number | string) => {
            return await fetchAPI(`/transactions/${id}`, {
                method: 'DELETE'
            });
        },
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
export function useStatistics(timeRange: 'month' | 'quarter' | 'year' = 'month', userId?: number) {
    const { user } = useAuth();
    const familyId = user?.currentFamilyId;
    const errorRef = useRef(false);

    // 使用useMemo计算日期范围和查询参数，避免每次渲染时重建
    const { startDate, endDate, queryParams } = useMemo(() => {
        const now = dayjs();
        let start: string;
        const end = now.format('YYYY-MM-DD');

        switch (timeRange) {
            case 'quarter':
                const quarterStart = Math.floor(now.month() / 3) * 3;
                start = now.month(quarterStart).startOf('month').format('YYYY-MM-DD');
                break;
            case 'year':
                start = now.startOf('year').format('YYYY-MM-DD');
                break;
            case 'month':
            default:
                start = now.startOf('month').format('YYYY-MM-DD');
        }

        // 构建查询参数
        const params = new URLSearchParams({
            startDate: start,
            endDate: end
        });

        // 根据模式添加不同的参数
        if (userId) {
            // 个人模式
            params.append('user_id', userId.toString());
        } else if (familyId) {
            // 家庭模式
            params.append('family_id', familyId.toString());
        }

        return {
            startDate: start,
            endDate: end,
            queryParams: params.toString()
        };
    }, [timeRange, userId, familyId]);

    return useQuery({
        queryKey: ['statistics', timeRange, userId ? `user_${userId}` : `family_${familyId}`],
        queryFn: async () => {
            try {
                const data = await fetchAPI<Statistics>(`/transactions/stats?${queryParams}`);
                errorRef.current = false;
                return data;
            } catch (error) {
                console.error('获取统计数据失败', error);
                errorRef.current = true;
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: errorRef.current ? 0 : 1, // 如果已经出错，则不再重试
        enabled: !!(userId || familyId), // 只有在有userId或familyId时才启用查询
    });
}

// 分类统计相关API
export function useCategoryStats(
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month',
    userId?: number,
    familyId?: number
) {
    const errorRef = useRef(false);

    console.log('useCategoryStats', timeRange, userId, familyId);
    // 构建查询参数
    const queryParams = new URLSearchParams({
        range: timeRange
    });

    // 根据模式添加不同的参数
    if (userId) {
        // 个人模式
        queryParams.append('user_id', userId.toString());
    } else if (familyId) {
        // 家庭模式
        queryParams.append('family_id', familyId.toString());
    }

    return useQuery({
        queryKey: ['categoryStats', timeRange, userId ? `user_${userId}` : `family_${familyId}`],
        queryFn: async () => {
            try {
                const data = await fetchAPI<CategoryStats[]>(`/transactions/stats/category?${queryParams.toString()}`);
                errorRef.current = false; // 重置错误状态
                return data;
            } catch (error) {
                console.error('获取分类统计失败:', error);
                errorRef.current = true; // 标记出现错误
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: errorRef.current ? 0 : 1, // 如果已经出错，则不再重试
        enabled: !!(userId || familyId), // 只有在有userId或familyId时才启用查询
    });
}

// 分类相关API
export function useCategories() {
    const { user } = useAuth();
    const { currentFamily, families = [] } = useFamily();
    const familyId = currentFamily?.id;
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const requestAttempted = useRef(false);
    const hasError = useRef(false);

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
                const result = await fetchAPI<Category[]>(`/categories/default`);
                return result;
            } catch (error) {
                console.error('获取默认分类失败:', error);
                hasError.current = true;
                throw error;
            }
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: hasError.current ? 0 : 3, // 如果已有错误，不再重试
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
                return [];
            }

            // 如果已请求过并且失败，则不再尝试请求
            if (requestAttempted.current && hasError.current) {
                return [];
            }

            try {
                // 获取自定义分类
                const result = await fetchAPI<Category[]>(`/categories/${familyId}/custom`);
                return result;
            } catch (error) {
                console.error('获取自定义分类失败:', error);
                requestAttempted.current = true;
                hasError.current = true;
                throw error;
            }
        },
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: hasError.current ? 0 : 3, // 如果已有错误，不再重试
        enabled: !!user && !!familyId, // 只有在用户已登录且选择了家庭时才启用查询
    });

    // 在家庭变更时重置请求状态
    useEffect(() => {
        if (familyId) {
            requestAttempted.current = false;
            hasError.current = false;
        }
    }, [familyId]);

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


// 从transactionService.ts合并的简化交易API
// 创建交易
export async function createTransaction(data: Transaction) {
    return await fetchAPI<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// 更新交易
export async function updateTransaction(id: string | number, data: Transaction) {
    return await fetchAPI<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// 获取单个交易
export async function getTransaction(id: string | number) {
    return await fetchAPI<Transaction>(`/transactions/${id}`);
}

// 获取交易列表
export async function getTransactions(params?: Record<string, string>) {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return await fetchAPI<Transaction[]>(`/transactions?${queryString}`);
}

// 获取单个交易记录
export function useTransactionById(id: number, userId?: number) {
    const { user } = useAuth();
    const familyId = user?.currentFamilyId;
    const { showToast } = useToast();
    const errorRef = useRef(false);

    // 构建查询参数
    const queryParams = useMemo(() => {
        const params = new URLSearchParams();

        // 根据模式添加不同的参数
        if (userId) {
            params.append('user_id', userId.toString());
        } else if (familyId) {
            params.append('family_id', familyId.toString());
        }

        return params.toString();
    }, [userId, familyId]);

    return useQuery({
        queryKey: ['transaction', id, userId ? `user_${userId}` : `family_${familyId}`],
        queryFn: async () => {
            try {
                const data = await fetchAPI<Transaction>(`/transactions/${id}?${queryParams}`);
                errorRef.current = false; // 重置错误状态
                return data;
            } catch (error: any) {
                console.error('获取交易记录失败:', error);
                errorRef.current = true; // 标记出现错误
                showToast(handleQueryError(error, '获取交易记录失败'), 'error');
                throw error;
            }
        },
        staleTime: 30 * 1000, // 30秒内数据不过期
        gcTime: 5 * 60 * 1000, // 5分钟后垃圾回收
        refetchOnWindowFocus: false,
        retry: errorRef.current ? 0 : 1, // 如果已经出错，不再重试
        enabled: !!id && !!(userId || familyId) // 只有在有id和(userId或familyId)时才启用查询
    });
}

// 账户相关钩子
export function useAccounts() {
    const { user } = useAuth();
    const familyId = user?.currentFamilyId;
    const { showToast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const requestAttempted = useRef(false);
    const hasNotFoundError = useRef(false); // 专门标记404错误
    const toastShown = useRef(false); // 防止重复显示Toast

    useEffect(() => {
        // 当用户ID或家庭ID变更时重置请求状态
        if (familyId || user?.id) {
            // 仅当家庭ID或用户ID变更时重置请求状态，但保留404错误标记
            requestAttempted.current = false;
        }

        const fetchAccounts = async () => {
            // 如果没有用户，不执行请求
            if (!user) {
                setAccounts([]);
                setIsLoading(false);
                return;
            }

            // 如果已经请求过并失败，不再重复请求
            // 特别是针对404错误，绝对不再重试
            if (requestAttempted.current || hasNotFoundError.current) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                let url = '/accounts';

                // 优先使用家庭ID，如果没有则使用用户ID
                if (familyId) {
                    url += `?family_id=${familyId}`;
                } else if (user?.id) {
                    url += `?user_id=${user.id}`;
                }

                requestAttempted.current = true; // 标记已尝试请求，放在请求前避免重复请求

                const data = await fetchAPI<Account[]>(url);
                setAccounts(data);
                setError(null);
                toastShown.current = false; // 成功获取数据后重置Toast标记
            } catch (err) {
                console.error('获取账户失败', err);

                // 检查是否为404错误
                const isNotFound = err instanceof APIError && err.status === 404;
                if (isNotFound) {
                    hasNotFoundError.current = true; // 标记为404错误

                    // 只显示一次Toast
                    if (!toastShown.current && showToast) {
                        showToast('账户数据尚未配置，请前往设置添加账户', 'info');
                        toastShown.current = true;
                    }
                } else if (!toastShown.current && showToast) {
                    showToast(handleQueryError(err as Error, '获取账户失败'), 'error');
                    toastShown.current = true;
                }

                setError(err as Error);
                setAccounts([]); // 设置空数组避免组件报错
            } finally {
                setIsLoading(false);
            }
        };

        // 仅在未处于404错误状态时执行请求
        if (user && !hasNotFoundError.current && !requestAttempted.current) {
            fetchAccounts();
        } else if (!user) {
            setAccounts([]);
            setIsLoading(false);
        }

        // 清理函数，在组件卸载时重置状态
        return () => {
            // 保留404错误状态，但重置其他状态
            toastShown.current = false;
        };
    }, [user?.id, familyId]); // 移除showToast，避免不必要的重新渲染

    return { accounts, isLoading, error };
}

// 家庭成员钩子
export function useMembers(familyId?: string | number) {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();
    const requestAttempted = useRef(false);
    const hasError = useRef(false);

    useEffect(() => {
        // 当familyId变更时重置请求状态
        if (familyId) {
            requestAttempted.current = false;
            hasError.current = false;
        }

        const fetchMembers = async () => {
            if (!familyId) {
                setMembers([]);
                setIsLoading(false);
                return;
            }

            // 如果已经请求过并失败，不再重复请求
            if (requestAttempted.current && hasError.current) {
                return;
            }

            try {
                setIsLoading(true);
                requestAttempted.current = true; // 在请求前标记，避免重复请求

                const url = `/families/${familyId}/members`;
                const data = await fetchAPI<Member[]>(url);
                setMembers(data);
                setError(null);
                hasError.current = false;
            } catch (err) {
                console.error('获取家庭成员失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取家庭成员失败'), 'error');
                setError(err as Error);
                setMembers([]); // 设置空数组避免组件报错
                hasError.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        // 仅在未处于错误状态或familyId变更时执行请求
        if (familyId && (!requestAttempted.current || !hasError.current)) {
            fetchMembers();
        } else if (!familyId) {
            setMembers([]);
            setIsLoading(false);
        }
    }, [familyId]); // 移除showToast依赖，避免不必要的重新渲染

    return { members, isLoading, error };
}
