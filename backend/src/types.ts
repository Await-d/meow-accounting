/*
 * @Author: Await
 * @Date: 2025-03-09 20:12:39
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 20:13:33
 * @Description: 请填写简介
 */
// 路由权限枚举
export enum RoutePermission {
    PUBLIC = 'public',     // 公开，任何人可访问
    PRIVATE = 'private',   // 私有，仅创建者可访问
    FAMILY = 'family',     // 家庭，仅家庭成员可访问
    ADMIN = 'admin'        // 管理员，仅家庭管理员可访问
}

// 路由接口
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

// 用户接口
export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: string;
    updated_at: string;
}

// 家庭接口
export interface Family {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
}

// 家庭成员接口
export interface FamilyMember {
    id: number;
    family_id: number;
    user_id: number;
    role: 'owner' | 'admin' | 'member';
    created_at: string;
} 