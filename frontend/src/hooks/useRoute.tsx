/*
 * @Author: Await
 * @Date: 2025-03-09 21:15:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 20:20:59
 * @Description: 路由管理Hook
 */
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Route, RoutePermission, CreateRouteData, UpdateRouteData } from '@/lib/types';
import { fetchApi } from '@/lib/fetch';
import { useToast } from '@/hooks/useToast';

export function useRoute() {
    const { user } = useAuth();
    const [userRoutes, setUserRoutes] = useState<Route[]>([]);
    const [familyRoutes, setFamilyRoutes] = useState<Route[]>([]);
    const [isLoadingUserRoutes, setIsLoadingUserRoutes] = useState(false);
    const [isLoadingFamilyRoutes, setIsLoadingFamilyRoutes] = useState(false);
    const { showToast } = useToast();

    // 获取用户的所有路由
    const fetchUserRoutes = useCallback(async () => {
        if (!user) return;
        setIsLoadingUserRoutes(true);
        try {
            const routes = await fetchApi<Route[]>('/api/routes/user/routes');
            setUserRoutes(routes);
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
            const routes = await fetchApi<Route[]>(`/api/routes/family/${familyId}/routes`);
            setFamilyRoutes(routes);
        } catch (error) {
            console.error('获取家庭路由失败:', error);
        } finally {
            setIsLoadingFamilyRoutes(false);
        }
    }, [user]);

    // 创建路由
    const createRoute = useCallback(async (data: CreateRouteData) => {
        if (!user) return;
        try {
            const response = await fetchApi<{ id: number }>('/api/routes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (data.family_id) {
                fetchFamilyRoutes(data.family_id);
            } else {
                fetchUserRoutes();
            }
            return response.id;
        } catch (error) {
            console.error('创建路由失败:', error);
            throw error;
        }
    }, [user, fetchUserRoutes, fetchFamilyRoutes]);

    // 更新路由
    const updateRoute = useCallback(async ({ id, data }: { id: number, data: UpdateRouteData }) => {
        if (!user) return;
        try {
            await fetchApi(`/api/routes/${id}`, {
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
            await fetchApi(`/api/routes/${id}`, {
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
            { key: RoutePermission.PUBLIC, label: '公开' },
            { key: RoutePermission.PRIVATE, label: '私有' },
            { key: RoutePermission.FAMILY, label: '家庭' },
            { key: RoutePermission.ADMIN, label: '管理员' }
        ];
    }, []);

    return {
        userRoutes,
        familyRoutes,
        isLoadingUserRoutes,
        isLoadingFamilyRoutes,
        fetchUserRoutes,
        fetchFamilyRoutes,
        createRoute,
        updateRoute,
        deleteRoute,
        getPermissionOptions
    };
} 