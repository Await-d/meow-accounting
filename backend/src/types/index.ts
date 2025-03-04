/*
 * @Author: Await
 * @Date: 2025-03-04 18:46:50
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 18:46:55
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