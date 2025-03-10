import { z } from 'zod';
import { RouteType, RoutePermission } from '../types';

// 创建路由验证
export const createRouteSchema = z.object({
    path: z.string().min(1).max(255),
    name: z.string().min(1).max(100),
    type: z.nativeEnum(RouteType),
    description: z.string().optional(),
    permission: z.nativeEnum(RoutePermission),
    family_id: z.number().optional()
});

// 更新路由验证
export const updateRouteSchema = createRouteSchema.partial().extend({
    is_active: z.boolean().optional()
});

// 记录访问验证
export const recordAccessSchema = z.object({
    route_id: z.number(),
    load_time: z.number().min(0),
    is_error: z.boolean(),
    error_message: z.string().optional(),
    from_cache: z.boolean()
});

// 路由参数验证
export const routeParamsSchema = z.record(z.any());

// 性能报告查询验证
export const performanceReportQuerySchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()
}); 