/*
 * @Author: Await
 * @Date: 2025-03-09 20:30:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 19:55:45
 * @Description: 路由模型
 */
import { BaseModel } from './base.model';
import { Route, RoutePermission } from '../types';
import { db } from '../config/database';

export class RouteModel extends BaseModel<Route> {
    constructor() {
        super('routes');
    }

    async createRoute(
        path: string,
        name: string,
        description: string,
        permission: RoutePermission,
        userId: number,
        familyId: number | null
    ): Promise<number> {
        return this.create({
            path,
            name,
            description,
            permission,
            user_id: userId,
            family_id: familyId,
            is_active: true
        });
    }

    async getRouteById(id: number): Promise<Route | null> {
        return this.findById(id);
    }

    async getRouteByPath(path: string): Promise<Route | null> {
        return this.findOne({ path });
    }

    async getUserRoutes(userId: number): Promise<Route[]> {
        return this.findMany({
            user_id: userId,
            family_id: null
        });
    }

    async getFamilyRoutes(familyId: number): Promise<Route[]> {
        return this.findMany({ family_id: familyId });
    }

    async updateRoute(
        id: number,
        updates: {
            name?: string;
            description?: string;
            permission?: RoutePermission;
            is_active?: boolean;
        }
    ): Promise<void> {
        await this.update(id, {
            ...updates,
            updated_at: new Date().toISOString()
        });
    }

    async deleteRoute(id: number): Promise<void> {
        await this.delete(id);
    }

    async routeExists(path: string, familyId: number | null): Promise<boolean> {
        const route = await this.findOne({
            path,
            family_id: familyId
        });
        return !!route;
    }

    async canAccessRoute(
        routeId: number,
        userId: number | null,
        familyId: number | null
    ): Promise<boolean> {
        if (!userId) return false;

        const route = await this.getRouteById(routeId);
        if (!route) return false;

        switch (route.permission) {
            case RoutePermission.PUBLIC:
                return true;
            case RoutePermission.PRIVATE:
                return route.user_id === userId;
            case RoutePermission.FAMILY:
                return route.family_id === familyId;
            case RoutePermission.ADMIN:
                if (!familyId) return false;
                const adminResult = await this.findOne({
                    family_id: familyId,
                    user_id: userId,
                    role: ['admin', 'owner']
                });
                return !!adminResult;
            default:
                return false;
        }
    }

    async findMany(conditions: Record<string, any> = {}): Promise<Route[]> {
        return super.findMany(conditions);
    }

    async checkRouteAccess(routeId: number, userId: number): Promise<boolean> {
        return this.canAccessRoute(routeId, userId, null);
    }

    async getRouteStats(routeId: number): Promise<any> {
        try {
            // 获取路由统计信息
            const statsQuery = `
                SELECT
                    COUNT(*) as access_count,
                    AVG(load_time) as avg_load_time,
                    MAX(load_time) as max_load_time,
                    MIN(load_time) as min_load_time
                FROM route_stats
                WHERE route_id = ?
            `;

            const stats = await db.findOne(statsQuery, [routeId]);

            return {
                routeId,
                accessCount: stats?.access_count || 0,
                avgLoadTime: stats?.avg_load_time || 0,
                maxLoadTime: stats?.max_load_time || 0,
                minLoadTime: stats?.min_load_time || 0
            };
        } catch (error) {
            console.error('获取路由统计失败:', error);
            throw error;
        }
    }
}

export const routeModel = new RouteModel();
export type { Route };

export async function initRouteTable(): Promise<void> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            family_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}
