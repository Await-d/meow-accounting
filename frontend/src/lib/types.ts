/*
 * @Author: Await
 * @Date: 2025-03-04 20:23:47
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:39:52
 * @Description: 类型定义文件
 */

// 通用类型
export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

// 交易相关类型
export interface Transaction {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    category_id: number;
    category_name: string;
    category_icon: string;
    description: string;
    date: string;
}

export type CreateTransactionData = Omit<Transaction, 'id'>;

export interface TransactionsResponse {
    items: Transaction[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
}

export interface TransactionFilter {
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    categoryId?: number;
    minAmount?: number;
    maxAmount?: number;
}

// 统计相关类型
export interface Statistics {
    total_income: number;
    total_expense: number;
    balance: number;
    chart: {
        date: string;
        income: number;
        expense: number;
    }[];
    details: {
        type: 'income' | 'expense';
        category_name: string;
        category_icon: string;
        total_amount: number;
        transaction_count: number;
    }[];
}

// 分类相关类型
export interface Category {
    id: number;
    name: string;
    icon: string;
    type: 'income' | 'expense';
    family_id: number | null;
    is_default: boolean;
    created_at: string;
}

export interface CategoryStats {
    name: string;
    category_icon: string;
    type: 'income' | 'expense';
    amount: number;
    trend: number[];
    percentage: number;
}

// 时间范围类型
export type TimeRange = 'week' | 'month' | 'quarter' | 'year';

// 用户相关类型
export interface User {
    id: number;
    username: string;
    email: string;
    role?: 'owner' | 'admin' | 'member';
    currentFamilyId?: number;
    privacy_mode?: boolean;
    created_at?: string;
    updated_at?: string;
}

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
export enum RoutePermission {
    PUBLIC = 'public',     // 公开，任何人可访问
    PRIVATE = 'private',   // 私有，仅创建者可访问
    FAMILY = 'family',     // 家庭，仅家庭成员可访问
    ADMIN = 'admin'        // 管理员，仅家庭管理员可访问
}

export interface Route {
    id: number;
    path: string;          // 路由路径
    name: string;          // 路由名称
    description: string;   // 路由描述
    permission: RoutePermission; // 访问权限
    user_id: number;       // 创建者ID
    family_id: number | null; // 家庭ID，如果是家庭路由
    is_active: boolean;    // 是否激活
    created_at: string;
    updated_at: string;
}

export interface CreateRouteData {
    path: string;
    name: string;
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
    family_id?: number | null;
} 