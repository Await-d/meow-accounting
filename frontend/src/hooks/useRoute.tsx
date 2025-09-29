/*
 * @Author: Await
 * @Date: 2025-03-09 21:15:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:55:43
 * @Description: 路由管理Hook
 */
'use client';

import {createContext, useContext, useState, useEffect, useCallback, Suspense} from 'react';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {useAuth} from './useAuth';
import {Route, RouteType, RoutePermission, CreateRouteData, UpdateRouteData, RouteParams, RouteConfig} from '@/lib/types';
import {fetchAPI} from '@/lib/api';
import {useToast} from '@/hooks/useToast';
import {routeComponents, checkRoutePermission, getRouteComponent} from '@/config/routes';
import {useRouteCache} from './useRouteCache';
import {useRoutePreload} from './useRoutePreload';
import {useRouteHistory} from './useRouteHistory';
import {useRouteAnalytics} from './useRouteAnalytics';
import {useRouteOptimizer} from './useRouteOptimizer';
import {useRouteMonitor} from '@/hooks/useRouteMonitor';
import {useRouteParams} from '@/hooks/useRouteParams';
import {toast} from 'sonner';

interface RouteContextType {
    currentRoute?: RouteConfig;
    params: RouteParams;
    userRoutes: Route[];
    familyRoutes: Route[];
    isLoadingUserRoutes: boolean;
    isLoadingFamilyRoutes: boolean;
    fetchUserRoutes: () => Promise<void>;
    fetchFamilyRoutes: (familyId: number) => Promise<void>;
    createRoute: (data: CreateRouteData) => Promise<number | undefined>;
    updateRoute: (params: { id: number; data: UpdateRouteData }) => Promise<void>;
    deleteRoute: (id: number) => Promise<void>;
    getPermissionOptions: () => { key: RoutePermission; label: string }[];
    navigateToRoute: (path: string, params?: RouteParams) => Promise<void>;
    checkAccess: (route: Route) => boolean;
    handleGoBack: () => Promise<void>;
    handleGoForward: () => Promise<void>;
    getHistorySummary: () => {
        canGoBack: boolean;
        canGoForward: boolean;
        historyLength: number;
        currentIndex: number;
    };
    getPerformanceReport: () => {
        totalRoutes: number;
        totalAccesses: number;
        totalErrors: number;
        averageLoadTime: number;
        mostAccessed?: {
            path: string;
            accessCount: number;
            averageLoadTime: number;
            lastAccessed: string;
            errorCount: number;
        } | null;
        mostErrors?: {
            path: string;
            accessCount: number;
            averageLoadTime: number;
            lastAccessed: string;
            errorCount: number;
        } | null;
        routeStats?: any;
        cacheHitRate: number;
        preheatingStatus: {
            total: number;
            completed: number;
        };
    };
    getCacheStats: () => {
        totalSize: number;
        itemCount: number;
        maxSize: number;
        usage: number;
    };
    getPreheatStatus: () => {
        preheating: string[];
        preheated: string[];
    };
    updateParams: (newParams: Partial<RouteParams>) => void;
    validateParams: (params: RouteParams) => boolean;
    clearPerformanceData: () => void;
    resetParams: () => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

function RouteProviderInner({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const {user} = useAuth();
    const [currentRoute, setCurrentRoute] = useState<RouteConfig>();
    const [params, setParams] = useState<RouteParams>({});
    const [userRoutes, setUserRoutes] = useState<Route[]>([]);
    const [familyRoutes, setFamilyRoutes] = useState<Route[]>([]);
    const [isLoadingUserRoutes, setIsLoadingUserRoutes] = useState(false);
    const [isLoadingFamilyRoutes, setIsLoadingFamilyRoutes] = useState(false);
    const {showToast} = useToast();
    const {getCachedRoute, cacheRoute, clearExpiredCache} = useRouteCache();
    const {preloadRoute, preloadRoutes} = useRoutePreload();
    const {
        addToHistory,
        goBack,
        goForward,
        getCurrentRoute,
        getHistorySummary
    } = useRouteHistory();
    const {
        startRouteLoad,
        endRouteLoad,
        getPerformanceReport,
        clearPerformanceData
    } = useRouteMonitor();
    const {
        preheatRoute,
        preheatRoutes,
        isRoutePreheated,
        getPreheatStatus,
        getRoutePriority
    } = useRouteOptimizer();
    const {saveParams, getParams, clearParams} = useRouteParams();

    // 解析URL参数
    const parseUrlParams = useCallback((): RouteParams => {
        const params: RouteParams = {};
        searchParams.forEach((value, key) => {
            if (key === 'page' || key === 'limit') {
                params[key] = parseInt(value);
            } else {
                params[key] = value;
            }
        });
        return params;
    }, [searchParams]);

    // 构建URL查询字符串
    const buildQueryString = (params: RouteParams): string => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                query.append(key, String(value));
            }
        });
        return query.toString();
    };

    // 验证参数
    const validateParams = useCallback((params: RouteParams): boolean => {
        if (!currentRoute?.validateParams) return true;
        return currentRoute.validateParams(params);
    }, [currentRoute]);

    // 更新参数
    const updateParams = useCallback((newParams: Partial<RouteParams>) => {
        const updatedParams = {...params, ...newParams};
        if (validateParams(updatedParams)) {
            const queryString = buildQueryString(updatedParams);
            router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
            setParams(updatedParams);

            // 保存到持久存储
            if (pathname) {
                saveParams(pathname, updatedParams);
            }
        }
    }, [params, pathname, router, validateParams, saveParams]);

    // 使用URL和持久化存储的参数
    useEffect(() => {
        const currentParams = parseUrlParams();
        if (Object.keys(currentParams).length > 0) {
            setParams(currentParams);
            if (pathname) {
                saveParams(pathname, currentParams);
            }
        } else if (pathname) {
            const savedParams = getParams(pathname);
            if (savedParams && Object.keys(savedParams).length > 0) {
                updateParams(savedParams);
            }
        }
    }, [pathname, parseUrlParams, getParams, saveParams, updateParams]);

    // 重置当前路由参数
    const resetParams = useCallback(() => {
        if (pathname) {
            clearParams(pathname);
            setParams({});
            router.push(pathname);
        }
    }, [pathname, router, clearParams]);

    // 获取用户的所有路由
    const fetchUserRoutes = useCallback(async () => {
        if (!user) return;
        setIsLoadingUserRoutes(true);
        try {
            const response = await fetchAPI<Route[]>('/routes/user/routes');
            setUserRoutes(response.data);
        } catch (error) {
            console.error('获取用户路由失败:', error);
        } finally {
            setIsLoadingUserRoutes(false);
        }
    }, [user]);

    // 获取家庭的所有路由
    const fetchFamilyRoutes = useCallback(async (familyId: number) => {
        if (!user) return;
        setIsLoadingFamilyRoutes(true);
        try {
            const response = await fetchAPI<Route[]>(`/routes/family/${familyId}/routes`);
            setFamilyRoutes(response.data);
        } catch (error) {
            console.error('获取家庭路由失败:', error);
        } finally {
            setIsLoadingFamilyRoutes(false);
        }
    }, [user]);

    // 加载用户路由
    useEffect(() => {
        if (user) {
            fetchUserRoutes();
        }
    }, [user, fetchUserRoutes]);

    // 加载家庭路由
    useEffect(() => {
        if (user?.currentFamilyId) {
            fetchFamilyRoutes(user.currentFamilyId);
        }
    }, [user?.currentFamilyId, fetchFamilyRoutes]);

    // 创建路由
    const createRoute = useCallback(async (data: CreateRouteData) => {
        if (!user) return;
        try {
            const response = await fetchAPI<{ id: number }>('/api/routes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (data.family_id) {
                fetchFamilyRoutes(data.family_id);
            } else {
                fetchUserRoutes();
            }
            showToast('路由创建成功', 'success');
            return response.data.id;
        } catch (error) {
            console.error('创建路由失败:', error);
            showToast('创建路由失败', 'error');
        }
    }, [user, fetchFamilyRoutes, fetchUserRoutes, showToast]);

    // 更新路由
    const updateRoute = useCallback(async ({id, data}: { id: number, data: UpdateRouteData }) => {
        if (!user) return;
        try {
            await fetchAPI(`/api/routes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            fetchUserRoutes();
            if (user.currentFamilyId) {
                fetchFamilyRoutes(user.currentFamilyId);
            }
        } catch (error) {
            console.error('更新路由失败:', error);
            throw error;
        }
    }, [user, fetchUserRoutes, fetchFamilyRoutes]);

    // 删除路由
    const deleteRoute = useCallback(async (id: number) => {
        if (!user) return;
        try {
            await fetchAPI(`/api/routes/${id}`, {
                method: 'DELETE'
            });
            fetchUserRoutes();
            if (user.currentFamilyId) {
                fetchFamilyRoutes(user.currentFamilyId);
            }
        } catch (error) {
            console.error('删除路由失败:', error);
            throw error;
        }
    }, [user, fetchUserRoutes, fetchFamilyRoutes]);

    // 获取权限选项
    const getPermissionOptions = useCallback(() => {
        return [
            {key: RoutePermission.PUBLIC, label: '公开'},
            {key: RoutePermission.PRIVATE, label: '私有'},
            {key: RoutePermission.FAMILY, label: '家庭'},
            {key: RoutePermission.ADMIN, label: '管理员'}
        ];
    }, []);

    // 检查路由访问权限
    const checkAccess = (route: Route): boolean => {
        return checkRoutePermission(
            route.type,
            route.permission,
            user?.id,
            user?.currentFamilyId
        );
    };

    // 预加载相关路由
    useEffect(() => {
        if (currentRoute) {
            // 按优先级预热相关路由
            const relatedRoutes = [...userRoutes, ...familyRoutes].filter(
                route => route.type === currentRoute.type && (!currentRoute.id || route.id !== currentRoute.id)
            );
            preheatRoutes(relatedRoutes);
        }
    }, [currentRoute, userRoutes, familyRoutes, preheatRoutes]);

    // 导航到路由
    const navigateToRoute = useCallback(async (path: string, newParams?: RouteParams) => {
        const route = [...userRoutes, ...familyRoutes].find(r => r.path === path);

        if (route && !checkAccess(route)) {
            toast.error('无权访问该路由');
            return;
        }

        try {
            // 开始记录加载时间
            const startTime = startRouteLoad(path);

            // 检查缓存
            const cachedRoute = getCachedRoute(path);
            if (cachedRoute) {
                setCurrentRoute(cachedRoute);
                addToHistory(cachedRoute);
                router.push(`${path}${newParams ? buildQueryString(newParams) : ''}`);
                if (newParams) {
                    setParams(newParams);
                }
                endRouteLoad(path, true, undefined, startTime, true);
                return;
            }

            // 检查是否已预热
            if (isRoutePreheated(path)) {
                if (route) {
                    cacheRoute(route);
                    setCurrentRoute(route);
                    addToHistory(route);
                }
                router.push(`${path}${newParams ? buildQueryString(newParams) : ''}`);
                if (newParams) {
                    setParams(newParams);
                }
                endRouteLoad(path, true, undefined, startTime, false);
                return;
            }

            // 预加载和导航
            router.push(`${path}${newParams ? buildQueryString(newParams) : ''}`);
            if (newParams) {
                setParams(newParams);
            }
            if (route) {
                await preheatRoute(route);
                cacheRoute(route);
                setCurrentRoute(route);
                addToHistory(route);
            }
            endRouteLoad(path, true, undefined, startTime, false);
        } catch (error) {
            console.error('导航失败:', error);
            endRouteLoad(path, false, error as Error);
            toast.error('导航失败');
        }
    }, [router, userRoutes, familyRoutes, checkAccess, startRouteLoad, endRouteLoad, getCachedRoute, isRoutePreheated, preheatRoute, cacheRoute, addToHistory, buildQueryString]);

    // 处理后退
    const handleGoBack = useCallback(async () => {
        const prevRoute = goBack();
        if (prevRoute) {
            await navigateToRoute(prevRoute.path, prevRoute.params || {});
        }
    }, [goBack, navigateToRoute]);

    // 处理前进
    const handleGoForward = useCallback(async () => {
        const nextRoute = goForward();
        if (nextRoute) {
            await navigateToRoute(nextRoute.path, nextRoute.params || {});
        }
    }, [goForward, navigateToRoute]);

    // 定期清理过期缓存
    useEffect(() => {
        const interval = setInterval(clearExpiredCache, 60000); // 每分钟清理一次
        return () => clearInterval(interval);
    }, [clearExpiredCache]);

    // 获取性能报告
    const getRoutePerformanceReport = useCallback(() => {
        const report = getPerformanceReport();
        // 添加缓存命中率和预热状态
        const {preheated, preheating} = getPreheatStatus();
        return {
            ...report,
            cacheHitRate: 0, // 这里可以计算实际的缓存命中率
            preheatingStatus: {
                total: preheating.length + preheated.length,
                completed: preheated.length
            }
        };
    }, [getPerformanceReport, getPreheatStatus]);

    const value = {
        currentRoute,
        params,
        userRoutes,
        familyRoutes,
        isLoadingUserRoutes,
        isLoadingFamilyRoutes,
        fetchUserRoutes,
        fetchFamilyRoutes,
        createRoute,
        updateRoute,
        deleteRoute,
        getPermissionOptions,
        navigateToRoute,
        checkAccess,
        handleGoBack,
        handleGoForward,
        getHistorySummary,
        getPerformanceReport: getRoutePerformanceReport,
        getCacheStats: () => ({
            totalSize: 0, // This is a placeholder implementation
            itemCount: 0, // This is a placeholder implementation
            maxSize: 0, // This is a placeholder implementation
            usage: 0 // This is a placeholder implementation
        }),
        getPreheatStatus,
        updateParams,
        validateParams,
        clearPerformanceData,
        resetParams
    };

    return (
        <RouteContext.Provider value={value}>
            {children}
        </RouteContext.Provider>
    );
}

export function RouteProvider({children}: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div>Loading routes...</div>}>
            <RouteProviderInner>
                {children}
            </RouteProviderInner>
        </Suspense>
    );
}

export function useRoute() {
    const context = useContext(RouteContext);
    if (!context) {
        throw new Error('useRoute must be used within a RouteProvider');
    }
    return context;
}
