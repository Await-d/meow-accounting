/*
 * @Author: Await
 * @Date: 2025-03-04 20:23:47
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:25:31
 * @Description: 请填写简介
 */
// 统计数据类型
export interface Statistics {
    totalIncome: number;
    totalExpense: number;
    trends: Array<{
        date: string;
        income: number;
        expense: number;
    }>;
    categories: Array<{
        name: string;
        amount: number;
    }>;
}

// 分类统计数据类型
export interface CategoryStats {
    name: string;
    category_icon: string;
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
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData extends LoginData {
    username: string;
} 