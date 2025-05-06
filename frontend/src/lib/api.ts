import { APIError, Transaction, TransactionFilter, } from './types';
import { getToken, removeToken } from '@/utils/auth';

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

interface APIResponse<T> {
    data: T;
    message?: string;
    status: number;
}

// 通用请求函数
export async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<APIResponse<T>> {
    const baseURL = API_BASE_URL;
    const url = `${baseURL}${endpoint}`;
    const token = getToken();

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        const data = await response.json();

        console.log("sssssss", data)
        if (!response.ok) {
            // 处理特定状态码
            const handler = statusHandlers[response.status];
            if (handler) {
                handler(data.message || '请求失败');
            }

            throw new APIError(response.status, data.message || '请求失败');
        }

        return {
            data: data,
            message: data.message,
            status: response.status
        };
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }

        // 处理网络错误等其他错误
        throw new APIError(500, error instanceof Error ? error.message : '网络错误');
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

// 路由预测系统API
export async function getRoutePredictions(userId: number) {
    const response = await fetchAPI<any>(`/routes/predictions?user_id=${userId}`, {
        method: 'GET',
    });
    return response.data;
}

// 获取路由优化建议
export async function getRouteOptimizationSuggestions(routeId: number) {
    const response = await fetchAPI<any>(`/routes/${routeId}/optimization`, {
        method: 'GET',
    });
    return response.data;
}

// 导出路由分析报告
export async function exportRouteAnalysisReport(options: {
    format: 'pdf' | 'csv' | 'excel',
    startDate?: string,
    endDate?: string,
    routeIds?: number[]
}) {
    // 构建查询参数
    const queryParams = new URLSearchParams();

    if (options.startDate) queryParams.append('startDate', options.startDate);
    if (options.endDate) queryParams.append('endDate', options.endDate);
    if (options.routeIds && options.routeIds.length > 0) {
        options.routeIds.forEach(id => queryParams.append('routeIds[]', id.toString()));
    }

    const url = `${API_BASE_URL}/routes/export?${queryParams.toString()}&format=${options.format}`;
    const token = getToken();

    // 使用fetch直接返回blob数据
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(response.status, errorData.message || '导出失败');
    }

    const blob = await response.blob();
    return blob;
}

// 获取更多数据可视化所需的数据
export async function getRouteVisualizationData(params: {
    type: 'distribution' | 'performance' | 'errors' | 'cache',
    startDate?: string,
    endDate?: string,
    routeIds?: number[]
}) {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('type', params.type);

    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.routeIds && params.routeIds.length > 0) {
        params.routeIds.forEach(id => queryParams.append('routeIds[]', id.toString()));
    }

    const response = await fetchAPI<any>(`/routes/visualization?${queryParams.toString()}`, {
        method: 'GET',
    });

    return response.data;
}
