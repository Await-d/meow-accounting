import { APIError, Transaction, TransactionFilter, } from './types';
import { getToken, removeToken } from '@/utils/auth';

// 动态获取API基础URL
const getApiBaseUrl = () => {
  // 优先使用环境变量中的API URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 如果是在浏览器环境中运行
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    // 生产环境下，优先使用相对路径（通过Nginx代理）
    if (port === '80' || port === '443' || port === '') {
      return '/api';
    }

    // 开发环境：如果是通过3000端口访问（前端端口），API在3001端口
    if (port === '3000') {
      return `${protocol}//${hostname}:3001/api`;
    }

    // 其他情况，假设是反向代理
    return '/api';
  }

  // 服务端渲染时的默认值
  return process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : '/api';
};

const API_BASE_URL = getApiBaseUrl();

// API配置验证函数
export function validateApiConfiguration() {
    const config = {
        baseUrl: API_BASE_URL,
        environment: typeof window !== 'undefined' ? 'client' : 'server',
        envVariable: process.env.NEXT_PUBLIC_API_URL,
        isProduction: process.env.NODE_ENV === 'production',
        timestamp: new Date().toISOString()
    };

    // 在开发环境下输出配置信息
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 API Configuration:', config);
    }

    return config;
}

// 健康检查函数
export async function checkApiHealth() {
    const startTime = Date.now();
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const healthData = await response.json();

        return {
            ...healthData,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime,
            apiUrl: API_BASE_URL,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.error('API health check failed:', error);
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime,
            apiUrl: API_BASE_URL,
            timestamp: new Date().toISOString()
        };
    }
}

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

// API性能监控和缓存管理
export class ApiPerformanceMonitor {
    private static instance: ApiPerformanceMonitor;
    private requestTimes: Map<string, number> = new Map();
    private responseCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
    private readonly defaultTtl = 5 * 60 * 1000; // 5分钟缓存

    static getInstance(): ApiPerformanceMonitor {
        if (!ApiPerformanceMonitor.instance) {
            ApiPerformanceMonitor.instance = new ApiPerformanceMonitor();
        }
        return ApiPerformanceMonitor.instance;
    }

    startRequest(endpoint: string): void {
        this.requestTimes.set(endpoint, Date.now());
    }

    endRequest(endpoint: string): number {
        const startTime = this.requestTimes.get(endpoint);
        if (!startTime) return 0;

        const duration = Date.now() - startTime;
        this.requestTimes.delete(endpoint);

        // 记录慢查询
        if (duration > 3000) {
            console.warn(`🐌 慢查询检测: ${endpoint} 耗时 ${duration}ms`);
        }

        return duration;
    }

    setCache(key: string, data: any, ttl: number = this.defaultTtl): void {
        this.responseCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    getCache(key: string): any | null {
        const cached = this.responseCache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            this.responseCache.delete(key);
            return null;
        }

        return cached.data;
    }

    clearCache(): void {
        this.responseCache.clear();
        console.log('🧹 API缓存已清理');
    }

    getPerformanceStats(): { averageResponseTime: number; cacheHitRate: number; activeCacheCount: number } {
        const now = Date.now();
        let validCacheCount = 0;

        this.responseCache.forEach((cache, key) => {
            if (now - cache.timestamp <= cache.ttl) {
                validCacheCount++;
            } else {
                this.responseCache.delete(key);
            }
        });

        return {
            averageResponseTime: 0, // 这里可以实现更详细的统计
            cacheHitRate: 0,
            activeCacheCount: validCacheCount
        };
    }
}

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

// Categories API
export async function useCategories() {
    return fetchAPI<any[]>('/categories');
}

export async function useCreateCategory(categoryData: any) {
    return fetchAPI('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
    });
}

export async function useUpdateCategory(id: number, categoryData: any) {
    return fetchAPI(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
    });
}

export async function useDeleteCategory(id: number) {
    return fetchAPI(`/categories/${id}`, {
        method: 'DELETE'
    });
}

// Transactions API
export async function useCreateTransaction(transactionData: any) {
    return fetchAPI('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
    });
}

export async function useTransactionById(id: number) {
    return fetchAPI(`/transactions/${id}`);
}

export async function useUpdateTransaction(id: number, transactionData: any) {
    return fetchAPI(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transactionData)
    });
}

// Routes API
export async function getAllRoutes() {
    return fetchAPI('/routes');
}

export async function createRoute(routeData: any) {
    return fetchAPI('/routes', {
        method: 'POST',
        body: JSON.stringify(routeData)
    });
}

export async function updateRoute(id: number, routeData: any) {
    return fetchAPI(`/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(routeData)
    });
}

export async function deleteRoute(id: number) {
    return fetchAPI(`/routes/${id}`, {
        method: 'DELETE'
    });
}

export async function toggleRouteActive(id: number) {
    return fetchAPI(`/routes/${id}/toggle`, {
        method: 'POST'
    });
}

export async function getRouteStats(id: number) {
    return fetchAPI(`/routes/${id}/stats`);
}

// Users API
export async function getAllUsers() {
    return fetchAPI('/users');
}

export async function updateUser(id: number, userData: any) {
    return fetchAPI(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
}

export async function deleteUser(id: number) {
    return fetchAPI(`/users/${id}`, {
        method: 'DELETE'
    });
}

export async function freezeUser(id: number) {
    return fetchAPI(`/users/${id}/freeze`, {
        method: 'POST'
    });
}

export async function unfreezeUser(id: number) {
    return fetchAPI(`/users/${id}/unfreeze`, {
        method: 'POST'
    });
}

export async function findUserByEmail(email: string) {
    const response = await fetchAPI(`/users/search?email=${encodeURIComponent(email)}`);
    const users = (response as any)?.data || [];
    if (users.length === 0) {
        throw new Error('未找到该邮箱对应的用户');
    }
    return users[0]; // 返回第一个匹配的用户
}

// Security API
export async function changePassword(passwordData: any) {
    return fetchAPI('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData)
    });
}

// Privacy API
export async function updatePrivacySettings(settingsData: any) {
    return fetchAPI('/users/privacy', {
        method: 'PUT',
        body: JSON.stringify(settingsData)
    });
}
