/*
 * @Author: Await
 * @Date: 2025-03-09 20:30:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 20:14:10
 * @Description: 路由模型
 */
import {Database} from 'sqlite3';
import {Route, RoutePermission} from '../types';

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

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

// 初始化路由表
export async function initRouteTable() {
    try {
        await db.run(`
            CREATE TABLE IF NOT EXISTS routes
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                path
                TEXT
                NOT
                NULL
                UNIQUE,
                name
                TEXT
                NOT
                NULL,
                description
                TEXT,
                permission
                TEXT
                NOT
                NULL,
                user_id
                INTEGER
                NOT
                NULL,
                family_id
                INTEGER,
                is_active
                BOOLEAN
                DEFAULT
                1,
                created_at
                DATETIME
                DEFAULT
                CURRENT_TIMESTAMP,
                updated_at
                DATETIME
                DEFAULT
                CURRENT_TIMESTAMP,
                FOREIGN
                KEY
            (
                user_id
            ) REFERENCES users
            (
                id
            ),
                FOREIGN KEY
            (
                family_id
            ) REFERENCES families
            (
                id
            )
                )
        `);
        console.log('路由表初始化成功');
    } catch (error) {
        console.error('路由表初始化失败:', error);
        throw error;
    }
}

// 创建路由
export async function createRoute(
    path: string,
    name: string,
    description: string,
    permission: RoutePermission,
    userId: number,
    familyId: number | null
): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO routes (path, name, description, permission, user_id, family_id, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [path, name, description, permission, userId, familyId, true],
            function (err: Error | null) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

// 获取路由信息
export async function getRouteById(id: number): Promise<Route | null> {
    return new Promise((resolve, reject) => {
        db.get<Route>(
            'SELECT * FROM routes WHERE id = ?',
            [id],
            (err: Error | null, row: Route | undefined) => {
                if (err) reject(err);
                else resolve(row || null);
            }
        );
    });
}

// 获取路由信息通过路径
export async function getRouteByPath(path: string): Promise<Route | null> {
    try {
        const route = await db.get<Route | undefined>(
            `SELECT *
             FROM routes
             WHERE path = ?`,
            [path]
        );
        return route || null;
    } catch (error) {
        console.error('获取路由信息失败:', error);
        throw error;
    }
}

// 获取用户的所有路由
export async function getUserRoutes(userId: number): Promise<Route[]> {
    return new Promise((resolve, reject) => {
        db.all<Route[]>(
            'SELECT * FROM routes WHERE user_id = ? AND family_id IS NULL',
            [userId],
            (err: Error | null, rows: Route[]) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

// 获取家庭的所有路由
export async function getFamilyRoutes(familyId: number): Promise<Route[]> {
    return new Promise((resolve, reject) => {
        db.all<Route[]>(
            'SELECT * FROM routes WHERE family_id = ?',
            [familyId],
            (err: Error | null, rows: Route[]) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

// 更新路由
export async function updateRoute(
    id: number,
    updates: {
        name?: string;
        description?: string;
        permission?: RoutePermission;
        is_active?: boolean;
    }
): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
        sets.push('name = ?');
        values.push(updates.name);
    }
    if (updates.description !== undefined) {
        sets.push('description = ?');
        values.push(updates.description);
    }
    if (updates.permission !== undefined) {
        sets.push('permission = ?');
        values.push(updates.permission);
    }
    if (updates.is_active !== undefined) {
        sets.push('is_active = ?');
        values.push(updates.is_active);
    }

    if (sets.length === 0) return;

    sets.push('updated_at = datetime("now")');
    values.push(id);

    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE routes
             SET ${sets.join(', ')}
             WHERE id = ?`,
            values,
            (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// 删除路由
export async function deleteRoute(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM routes WHERE id = ?',
            [id],
            (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// 检查路由是否存在
export async function routeExists(path: string, familyId: number | null): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT id FROM routes WHERE path = ? AND family_id = ?',
            [path, familyId],
            (err: Error | null, row: any) => {
                if (err) reject(err);
                else resolve(!!row);
            }
        );
    });
}

// 检查用户是否有权限访问路由
export async function canAccessRoute(
    routeId: number,
    userId: number | null,
    familyId: number | null
): Promise<boolean> {
    if (!userId) return false;

    const route = await getRouteById(routeId);
    if (!route) return false;

    switch (route.permission) {
        case RoutePermission.PUBLIC:
            return true;
        case RoutePermission.PRIVATE:
            return route.user_id === userId;
        case RoutePermission.FAMILY:
            return route.family_id === familyId;
        case RoutePermission.ADMIN:
            // 需要检查用户是否是家庭管理员
            if (!familyId) return false;
            return new Promise((resolve, reject) => {
                db.get(
                    'SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? AND role IN ("admin", "owner")',
                    [familyId, userId],
                    (err: Error | null, row: any) => {
                        if (err) reject(err);
                        else resolve(!!row);
                    }
                );
            });
        default:
            return false;
    }
}
