/*
 * @Author: Await
 * @Date: 2025-03-10 19:44:42
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 19:45:25
 * @Description: 请填写简介
 */
import { useCallback, useEffect } from 'react';
import { Route, RouteType } from '@/lib/types';
import { routeComponents } from '@/config/routes';

export function useRoutePreload() {
    // 预加载单个路由
    const preloadRoute = useCallback(async (route: Route) => {
        try {
            const routeConfig = routeComponents[route.type];
            if (!routeConfig) return;

            // 预加载组件
            const componentPromise = routeConfig.component();
            const layoutPromise = routeConfig.layout ? routeConfig.layout() : Promise.resolve(null);

            await Promise.all([componentPromise, layoutPromise]);
        } catch (error) {
            console.error(`预加载路由失败: ${route.path}`, error);
        }
    }, []);

    // 预加载多个路由
    const preloadRoutes = useCallback(async (routes: Route[]) => {
        const promises = routes.map(route => preloadRoute(route));
        await Promise.allSettled(promises);
    }, [preloadRoute]);

    // 预加载特定类型的路由
    const preloadRouteType = useCallback(async (type: RouteType) => {
        try {
            const routeConfig = routeComponents[type];
            if (!routeConfig) return;

            // 预加载组件
            const componentPromise = routeConfig.component();
            const layoutPromise = routeConfig.layout ? routeConfig.layout() : Promise.resolve(null);

            await Promise.all([componentPromise, layoutPromise]);
        } catch (error) {
            console.error(`预加载路由类型失败: ${type}`, error);
        }
    }, []);

    return {
        preloadRoute,
        preloadRoutes,
        preloadRouteType
    };
} 