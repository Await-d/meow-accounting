import { RouteType, RoutePermission } from '@/lib/types';
import type { ComponentType } from 'react';

// 路由组件类型
export interface RouteComponent {
    component: () => Promise<ComponentType<any>>;
    permission: RoutePermission;
    layout?: () => Promise<ComponentType<any>>;
}

// 路由组件映射
export const routeComponents: Record<RouteType, RouteComponent> = {
    [RouteType.DASHBOARD]: {
        component: () => import('@/app/dashboard/page').then(mod => mod.default),
        permission: RoutePermission.PRIVATE,
        layout: () => import('@/app/dashboard/layout').then(mod => mod.default)
    },
    [RouteType.TRANSACTIONS]: {
        component: () => import('@/app/transactions/page').then(mod => mod.default),
        permission: RoutePermission.FAMILY,
        layout: () => import('@/app/transactions/layout').then(mod => mod.default)
    },
    [RouteType.STATISTICS]: {
        component: () => import('@/app/statistics/page').then(mod => mod.default),
        permission: RoutePermission.FAMILY,
        layout: () => import('@/app/statistics/layout').then(mod => mod.default)
    },
    [RouteType.SETTINGS]: {
        component: () => import('@/app/settings/page').then(mod => mod.default),
        permission: RoutePermission.PRIVATE,
        layout: () => import('@/app/settings/layout').then(mod => mod.default)
    },
    [RouteType.CUSTOM]: {
        component: () => import('@/app/custom/page').then(mod => mod.default),
        permission: RoutePermission.PRIVATE,
        layout: () => import('@/app/custom/layout').then(mod => mod.default)
    }
};

// 默认路由配置
export const defaultRoutes = {
    dashboard: '/dashboard',
    transactions: '/transactions',
    statistics: '/statistics',
    settings: '/settings'
};

// 路由权限检查
export function checkRoutePermission(
    routeType: RouteType,
    permission: RoutePermission,
    userId?: number,
    familyId?: number | null
): boolean {
    const routeConfig = routeComponents[routeType];

    switch (permission) {
        case RoutePermission.PUBLIC:
            return true;
        case RoutePermission.PRIVATE:
            return !!userId;
        case RoutePermission.FAMILY:
            return !!userId && !!familyId;
        case RoutePermission.ADMIN:
            // 需要检查用户是否是家庭管理员
            return !!userId && !!familyId;
        default:
            return false;
    }
}

// 获取路由组件
export async function getRouteComponent(path: string, type: RouteType) {
    const routeConfig = routeComponents[type];
    if (!routeConfig) {
        throw new Error(`未找到路由类型 ${type} 对应的组件`);
    }

    try {
        const Component = await routeConfig.component();
        const Layout = routeConfig.layout ? await routeConfig.layout() : null;

        return {
            Component,
            Layout,
            permission: routeConfig.permission
        };
    } catch (error) {
        console.error(`加载路由组件失败: ${error}`);
        throw error;
    }
} 