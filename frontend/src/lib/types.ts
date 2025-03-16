/*
 * @Author: Await
 * @Date: 2025-03-15 11:01:14
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:07:42
 * @Description: 请填写简介
 */
/*
 * @Author: Await
 * @Date: 2025-03-04 20:23:47
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 10:59:53
 * @Description: 类型定义文件
 */

// 交易类型
export type TransactionType = 'income' | 'expense';

// 交易记录类型
export interface Transaction {
    id: number;
    familyId: number;
    amount: number;
    type: TransactionType;
    category?: string;
    category_id?: number;
    category_name?: string;
    category_icon?: string;
    description: string;
    date: string;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    user_id?: number;
    username?: string;
}

// 分类接口
export interface Category {
    id: number | string;
    name: string;
    icon?: string;
    type: TransactionType;
    is_default?: boolean;
    family_id?: number;
    familyId?: string;
    created_at?: string;
}

// 账户接口
export interface Account {
    id: number | string;
    name: string;
    balance: number;
    icon?: string;
    color?: string;
    user_id?: number;
    userId?: string;
    family_id?: number;
    familyId?: string;
}

// 成员接口
export interface Member {
    id: number;
    familyId: number;
    userId: number;
    name: string;
    email: string;
    role: 'admin' | 'member';
    avatar?: string;
    joinedAt: string;
}

// 用户接口
export interface User {
    id: number;
    username: string;
    email: string;
    nickname?: string;
    avatar?: string;
    role: 'user' | 'admin' | 'owner';
    privacy_mode?: boolean;
    default_route?: string;
    currentFamilyId?: number;
    settings?: {
        theme?: string;
        language?: string;
        routePreload?: boolean;
        privacy?: {
            showAmount?: boolean;
            showCategory?: boolean;
            dataRetention?: string;
        };
        [key: string]: any;
    };
    maxFamilies?: number;
    maxFamilyJoins?: number;
    is_frozen?: boolean;
    created_at?: string;
    updated_at?: string;
    permissions?: string[];
}

// 通用类型
export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

export type CreateTransactionData = {
    type: TransactionType;
    amount: number;
    category_id: number;
    description: string;
    date: string;
    category_name?: string;
    category_icon?: string;
    familyId?: number;
};

export type UpdateTransactionData = CreateTransactionData & {
    id: number;
};

export interface TransactionsResponse {
    items: Transaction[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
}

// 交易过滤器类型
export type TransactionFilter = {
    type?: TransactionType;
    categoryIds?: number[];
    categoryId?: string | number; // 添加兼容字段
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    types?: string[];
    search?: string;
    onFilter?: (filter: TransactionFilter) => void; // 添加onFilter接口
};

// 统计相关类型
export type Statistics = {
    total_income: number;
    total_expense: number;
    balance: number;
    chart: Array<{
        date: string;
        income: number;
        expense: number;
    }>;
    details: Array<{
        category_name: string;
        category_icon: string;
        type: 'income' | 'expense';
        transaction_count: number;
        total_amount: number;
    }>;
};

export type CategoryStats = {
    id: number;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    color?: string;
};

// 时间范围类型
export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

// 用户设置
export interface UserSettings {
    privacy_mode: boolean;
    default_route: string;
    currentFamilyId?: number;
}

// 家庭相关类型
export interface Family {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
    member_count?: number; // 成员数量
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

// 路由相关类型
export enum RouteType {
    DASHBOARD = 'dashboard',    // 仪表盘
    TRANSACTIONS = 'transactions', // 交易记录
    STATISTICS = 'statistics',  // 统计分析
    SETTINGS = 'settings',      // 设置
    CUSTOM = 'custom'          // 自定义页面
}

export enum RoutePermission {
    PUBLIC = 'public',     // 公开，任何人可访问
    PRIVATE = 'private',   // 私有，仅创建者可访问
    FAMILY = 'family',     // 家庭，仅家庭成员可访问
    ADMIN = 'admin'        // 管理员，仅家庭管理员可访问
}

export interface Route {
    id: number;
    path: string;
    name: string;
    type: RouteType;
    description: string;
    permission: RoutePermission;
    user_id: number;
    family_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    params?: RouteParams;
}

export interface CreateRouteData {
    path: string;
    name: string;
    type: RouteType;
    description: string;
    permission: RoutePermission;
    family_id?: number | null;
    is_active?: boolean;
}

export interface UpdateRouteData {
    name?: string;
    description?: string;
    permission?: RoutePermission;
    is_active?: boolean;
    path?: string;
    type?: RouteType;
    family_id?: number | null;
}

// 路由参数类型
export interface RouteParams {
    id?: string | number;
    type?: string;
    view?: string;
    filter?: string;
    sort?: string;
    page?: number;
    limit?: number;

    [key: string]: any;
}

// 路由配置类型
export interface RouteConfig {
    id?: number;
    name: string;
    path: string;
    type: RouteType;
    icon?: string;
    params?: RouteParams;
    validateParams?: (params: RouteParams) => boolean;
}

export interface RouteStats {
    totalAccesses: number;
    averageLoadTime: number;
    totalErrors: number;
    cacheHits: number;
    accessHistory: {
        timestamp: string;
        loadTime: number;
        errorCount: number;
    }[];
}

export interface Invitation {
    id: number;
    email: string;
    role: 'admin' | 'member';
    status: 'pending' | 'accepted' | 'rejected';
    expires_at: string;
    created_at: string;
}

// 账单类型
export interface Bill {
    id: number;
    familyId: number;
    title: string;
    description?: string;
    amount: number;
    dueDate: string;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
}
