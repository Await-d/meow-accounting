import { db } from '../config/database';
import { RouteParams } from '../types/index';

// 保存路由参数
export async function saveParams(
    routeId: number,
    userId: number,
    params: Record<string, any>
): Promise<void> {
    const existing = await db.findOne<RouteParams>(
        'SELECT * FROM route_params WHERE route_id = ? AND user_id = ?',
        [routeId, userId]
    );

    if (existing) {
        await db.execute(
            `UPDATE route_params
             SET params = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE route_id = ?
               AND user_id = ?`,
            [JSON.stringify(params), routeId, userId]
        );
    } else {
        await db.execute(
            `INSERT INTO route_params (route_id, user_id, params)
             VALUES (?, ?, ?)`,
            [routeId, userId, JSON.stringify(params)]
        );
    }
}

// 获取路由参数
export async function getParams(
    routeId: number,
    userId: number
): Promise<Record<string, any> | null> {
    const result = await db.findOne<RouteParams>(
        'SELECT params FROM route_params WHERE route_id = ? AND user_id = ?',
        [routeId, userId]
    );

    if (!result) {
        return null;
    }

    return result.params;
}

// 清除路由参数
export async function clearParams(routeId: number, userId: number): Promise<void> {
    await db.execute(
        'DELETE FROM route_params WHERE route_id = ? AND user_id = ?',
        [routeId, userId]
    );
}

// 获取用户所有路由参数
export async function getAllParams(userId: number): Promise<Record<string, Record<string, any>>> {
    const results = await db.findMany<RouteParams & { path: string }>(
        `SELECT rp.*, r.path
         FROM route_params rp
                  JOIN routes r ON rp.route_id = r.id
         WHERE rp.user_id = ?`,
        [userId]
    );

    return results.reduce((acc: Record<string, Record<string, any>>, curr: RouteParams & { path: string }) => ({
        ...acc,
        [curr.path]: curr.params
    }), {});
}

// 验证参数
export async function validateParams(
    routeId: number,
    params: Record<string, any>
): Promise<boolean> {
    // TODO: 实现参数验证逻辑
    // 可以从路由配置中获取验证规则
    return true;
}

// 批量保存参数
export async function bulkSaveParams(
    userId: number,
    params: Record<string, Record<string, any>>
): Promise<void> {
    const routes = await db.findMany<{ id: number, path: string }>(
        'SELECT id, path FROM routes WHERE user_id = ?',
        [userId]
    );

    const routeMap: Record<string, number> = routes.reduce((acc: Record<string, number>, curr: { id: number, path: string }) => ({
        ...acc,
        [curr.path]: curr.id
    }), {});

    for (const [path, pathParams] of Object.entries(params)) {
        const routeId = routeMap[path];
        if (routeId) {
            await saveParams(routeId, userId, pathParams);
        }
    }
}

// 获取参数历史记录
export async function getParamsHistory(
    routeId: number,
    userId: number,
    limit: number = 10
): Promise<Array<{
    params: Record<string, any>;
    created_at: string;
}>> {
    const results = await db.findMany<{
        params: string;
        created_at: string;
    }>(
        `SELECT params, created_at
         FROM route_params_history
         WHERE route_id = ?
           AND user_id = ?
         ORDER BY created_at DESC LIMIT ?`,
        [routeId, userId, limit]
    );

    return results.map((result: { params: string, created_at: string }) => ({
        params: JSON.parse(result.params),
        created_at: result.created_at
    }));
}
