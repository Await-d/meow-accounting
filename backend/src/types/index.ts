/*
 * @Author: Await
 * @Date: 2025-03-04 18:46:50
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 21:35:16
 * @Description: 请填写简介
 */
export interface Category {
    id?: number;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    created_at?: string;
}

export interface Transaction {
    id?: number;
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    description?: string;
    date: string;
    created_at?: string;
}

export enum RouteType {
    PAGE = 'PAGE',
    COMPONENT = 'COMPONENT',
    API = 'API',
    DASHBOARD = 'DASHBOARD'
}

export enum RoutePermission {
    PUBLIC = 'PUBLIC',
    PRIVATE = 'PRIVATE',
    FAMILY = 'FAMILY',
    ADMIN = 'ADMIN'
}

export interface Route {
    id: number;
    path: string;
    name: string;
    type: RouteType;
    description?: string;
    permission: RoutePermission;
    user_id?: number;
    family_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface RouteStats {
    id: number;
    route_id: number;
    access_count: number;
    error_count: number;
    total_load_time: number;
    average_load_time: number;
    last_accessed?: string;
    cache_hits: number;
    cache_misses: number;
    created_at: string;
    updated_at: string;
}

export interface RouteParams {
    id: number;
    route_id: number;
    user_id: number;
    params: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface UserSettings {
    id: number;
    user_id: number;
    theme: 'light' | 'dark' | 'system';
    language: string;
    appearance: {
        fontSize: number;
        animationSpeed: number;
        density: 'comfortable' | 'compact' | 'spacious';
    };
    performance: {
        prefetch: boolean;
        cacheSize: number;
        reducedAnimations: boolean;
    };
    notifications: {
        email: boolean;
        push: boolean;
        desktop: boolean;
        summary: 'daily' | 'weekly' | 'never';
    };
    created_at: string;
    updated_at: string;
}

export interface CreateRouteData {
    path: string;
    name: string;
    type: RouteType;
    description?: string;
    permission: RoutePermission;
    family_id?: number;
}

export interface UpdateRouteData extends Partial<CreateRouteData> {
    is_active?: boolean;
}

export interface RecordRouteAccessData {
    route_id: number;
    load_time: number;
    is_error: boolean;
    error_message?: string;
    from_cache: boolean;
}

export interface PerformanceReport {
    totalRoutes: number;
    totalAccesses: number;
    totalErrors: number;
    averageLoadTime: number;
    mostAccessed: {
        path: string;
        accessCount: number;
        averageLoadTime: number;
        lastAccessed: string;
        errorCount: number;
    } | null;
    mostErrors: {
        path: string;
        accessCount: number;
        averageLoadTime: number;
        lastAccessed: string;
        errorCount: number;
    } | null;
    routeStats: Record<string, RouteStats>;
}

export interface ApiResponse<T = any> {
    code: number;
    data?: T;
    message: string;
} 