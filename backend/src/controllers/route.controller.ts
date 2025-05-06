/*
 * @Author: Await
 * @Date: 2025-03-09 20:45:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:47:07
 * @Description: 路由控制器
 */
import { Request, Response } from 'express';
import { routeModel, Route } from '../models/route';
import * as familyModel from '../models/family';
import { RoutePermission } from '../types';
import { APIError } from '../middlewares/error';

// 创建路由
export async function createRoute(req: Request, res: Response) {
    try {
        const { path, name, description, permission, familyId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查路由路径是否已存在
        const exists = await routeModel.routeExists(path, familyId);
        if (exists) {
            return res.status(400).json({ error: '路由路径已存在' });
        }

        // 如果是家庭路由，检查用户是否是家庭创建者
        if (familyId) {
            const isAdmin = await routeModel.canAccessRoute(familyId, userId, familyId);
            if (!isAdmin) {
                return res.status(403).json({ error: '无权创建家庭路由' });
            }
        }

        const routeId = await routeModel.createRoute(
            path,
            name,
            description,
            permission,
            userId,
            familyId
        );

        res.status(201).json({ id: routeId });
    } catch (error) {
        console.error('创建路由失败:', error);
        res.status(500).json({ error: '创建路由失败' });
    }
}

// 获取路由信息
export async function getRouteById(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;
        const familyId = req.user?.currentFamilyId ?? null;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, familyId ?? null);
        if (!canAccess) {
            return res.status(403).json({ error: '无权访问此路由' });
        }

        res.json(route);
    } catch (error) {
        console.error('获取路由信息失败:', error);
        res.status(500).json({ error: '获取路由信息失败' });
    }
}

// 获取所有路由（管理员专用）
export const getAllRoutes = async (req: Request, res: Response) => {
    try {
        const routes = await routeModel.findMany({});

        // 将路由分类为个人路由和家庭路由
        const personalRoutes = routes.filter(route => !route.family_id);
        const familyRoutes = routes.filter(route => route.family_id);

        res.json({
            personalRoutes,
            familyRoutes
        });
    } catch (error) {
        throw new APIError(500, '获取路由列表失败');
    }
};

// 获取用户的所有路由
export const getUserRoutes = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        const routes = await routeModel.getUserRoutes(userId);
        res.json(routes);
    } catch (error) {
        throw new APIError(500, '获取用户路由失败');
    }
};

// 获取家庭的所有路由
export const getFamilyRoutes = async (req: Request, res: Response) => {
    try {
        const { familyId } = req.params;
        const routes = await routeModel.getFamilyRoutes(parseInt(familyId));
        res.json(routes);
    } catch (error) {
        throw new APIError(500, '获取家庭路由失败');
    }
};

// 更新路由
export async function updateRoute(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const { name, description, permission, is_active } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }
        const familyId = req.user?.currentFamilyId ?? null;

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查是否有权限更新
        const canAccess = await routeModel.canAccessRoute(routeId, userId, familyId);
        if (!canAccess) {
            return res.status(403).json({ error: '无权更新此路由' });
        }

        await routeModel.updateRoute(routeId, {
            name,
            description,
            permission,
            is_active
        });

        res.json({ message: '路由更新成功' });
    } catch (error) {
        console.error('更新路由失败:', error);
        res.status(500).json({ error: '更新路由失败' });
    }
}

// 删除路由
export async function deleteRoute(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;
        const familyId = req.user?.currentFamilyId ?? null;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查是否有权限删除
        const canAccess = await routeModel.canAccessRoute(routeId, userId, familyId);
        if (!canAccess) {
            return res.status(403).json({ error: '无权删除此路由' });
        }

        await routeModel.deleteRoute(routeId);
        res.json({ message: '路由删除成功' });
    } catch (error) {
        console.error('删除路由失败:', error);
        res.status(500).json({ error: '删除路由失败' });
    }
}

// 检查路由访问权限
export async function checkAccess(req: Request, res: Response) {
    try {
        const path = req.params.path;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 获取路由信息
        const route = await routeModel.getRouteByPath(path);
        if (!route) {
            return res.status(404).json({ error: '路由不存在' });
        }

        // 检查访问权限
        const hasAccess = await routeModel.checkRouteAccess(route.id, userId);
        res.json({ hasAccess });
    } catch (error) {
        console.error('检查路由访问权限失败:', error);
        res.status(500).json({ error: '检查路由访问权限失败' });
    }
}

// 切换路由状态
export async function toggleRouteActive(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            throw new APIError(401, '未登录');
        }

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            throw new APIError(404, '路由不存在');
        }

        // 检查是否有权限更新
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            throw new APIError(403, '无权更新此路由');
        }

        // 切换状态
        await routeModel.updateRoute(routeId, {
            is_active: !route.is_active
        });

        res.json({ message: '状态更新成功' });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '更新路由状态失败');
    }
}

// 获取路由性能统计
export async function getRouteStats(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            throw new APIError(401, '未登录');
        }

        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            throw new APIError(404, '路由不存在');
        }

        // 检查是否有权限查看
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            throw new APIError(403, '无权查看此路由');
        }

        // 获取性能统计数据
        const stats = await routeModel.getRouteStats(routeId);

        res.json(stats);
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由统计失败');
    }
}

// 获取路由预测
export async function getRoutePredictions(req: Request, res: Response) {
    try {
        const userId = parseInt(req.query.user_id as string) || req.user?.id;
        
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        
        // 获取用户的路由访问历史并分析预测
        // 这里使用模拟数据，实际项目中应该从数据库中查询
        const topRoutes = [
            {
                path: '/dashboard',
                name: '仪表盘',
                confidence: 92,
                lastAccess: new Date().toISOString(),
                accessCount: 158
            },
            {
                path: '/transactions',
                name: '交易记录',
                confidence: 78,
                lastAccess: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                accessCount: 85
            },
            {
                path: '/settings/profile',
                name: '个人资料',
                confidence: 54,
                lastAccess: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                accessCount: 42
            }
        ];
        
        res.json({ topRoutes });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由预测失败');
    }
}

// 获取路由优化建议
export async function getRouteOptimizationSuggestions(req: Request, res: Response) {
    try {
        const routeId = parseInt(req.params.id);
        const userId = req.user?.id;
        
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        
        // 获取路由信息
        const route = await routeModel.getRouteById(routeId);
        if (!route) {
            throw new APIError(404, '路由不存在');
        }
        
        // 检查是否有权限
        const canAccess = await routeModel.canAccessRoute(routeId, userId, req.user?.currentFamilyId ?? null);
        if (!canAccess) {
            throw new APIError(403, '无权查看此路由');
        }
        
        // 获取优化建议
        // 这里使用模拟数据，实际项目中应该基于性能统计生成
        const suggestions = [
            {
                id: '1',
                title: '启用组件缓存',
                description: '通过启用React组件缓存，可以减少不必要的重新渲染，提升页面加载速度。',
                priority: 'high',
                category: 'performance',
                impact: '预计可减少30%的加载时间'
            },
            {
                id: '2',
                title: '优化数据获取',
                description: '当前路由在进入时发起了多个并行请求，可以合并API调用或使用GraphQL减少请求数量。',
                priority: 'medium',
                category: 'performance',
                impact: '预计可减少40%的网络请求时间'
            },
            {
                id: '3',
                title: '图片懒加载',
                description: '实现图片懒加载，仅在需要时加载图片资源。',
                priority: 'low',
                category: 'performance',
                impact: '预计可减少20%的初始加载时间'
            },
            {
                id: '4',
                title: '提高缓存命中率',
                description: '当前路由的缓存命中率较低，可以通过调整缓存策略提高命中率。',
                priority: 'medium',
                category: 'caching',
                impact: '预计可提高缓存命中率25%'
            }
        ];
        
        res.json(suggestions);
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由优化建议失败');
    }
}

// 导出路由分析报告
export async function exportRouteAnalysisReport(req: Request, res: Response) {
    try {
        const format = req.query.format as string || 'pdf';
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const routeIds = req.query['routeIds[]'] ? 
            (Array.isArray(req.query['routeIds[]']) ? 
                req.query['routeIds[]'].map(id => parseInt(id as string)) : 
                [parseInt(req.query['routeIds[]'] as string)]) : 
            [];
        
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        
        // 生成报告数据
        // 这里使用模拟数据，实际项目中应根据参数从数据库查询生成报告
        const reportData = {
            title: '路由分析报告',
            generatedAt: new Date().toISOString(),
            period: {
                startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: endDate || new Date().toISOString()
            },
            summary: {
                totalRoutes: 15,
                totalAccesses: 1243,
                averageLoadTime: 320,
                errorRate: 0.8
            },
            topRoutes: [
                { path: '/dashboard', accessCount: 328, averageLoadTime: 280 },
                { path: '/transactions', accessCount: 215, averageLoadTime: 350 },
                { path: '/statistics', accessCount: 189, averageLoadTime: 420 }
            ]
        };
        
        // 根据格式返回不同类型的报告
        switch (format) {
            case 'pdf':
                // 实际项目中应该生成PDF文件
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="route-report-${new Date().toISOString().split('T')[0]}.pdf"`);
                res.send(Buffer.from(JSON.stringify(reportData)));
                break;
                
            case 'excel':
                // 实际项目中应该生成Excel文件
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename="route-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
                res.send(Buffer.from(JSON.stringify(reportData)));
                break;
                
            case 'csv':
                // 实际项目中应该生成CSV文件
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="route-report-${new Date().toISOString().split('T')[0]}.csv"`);
                res.send(Buffer.from(JSON.stringify(reportData)));
                break;
                
            default:
                throw new APIError(400, '不支持的导出格式');
        }
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '导出路由分析报告失败');
    }
}

// 获取路由可视化数据
export async function getRouteVisualizationData(req: Request, res: Response) {
    try {
        const type = req.query.type as string || 'performance';
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const routeIds = req.query['routeIds[]'] ? 
            (Array.isArray(req.query['routeIds[]']) ? 
                req.query['routeIds[]'].map(id => parseInt(id as string)) : 
                [parseInt(req.query['routeIds[]'] as string)]) : 
            [];
        
        const userId = req.user?.id;
        if (!userId) {
            throw new APIError(401, '未登录');
        }
        
        // 根据类型返回不同的可视化数据
        let data;
        switch (type) {
            case 'performance':
                // 性能数据
                data = [
                    { id: 1, name: '/dashboard', loadTime: 320, errorRate: 0.5, cacheHitRate: 89 },
                    { id: 2, name: '/transactions', loadTime: 450, errorRate: 1.2, cacheHitRate: 76 },
                    { id: 3, name: '/statistics', loadTime: 580, errorRate: 0.8, cacheHitRate: 62 },
                    { id: 4, name: '/settings', loadTime: 280, errorRate: 0.2, cacheHitRate: 94 },
                    { id: 5, name: '/profile', loadTime: 390, errorRate: 0.7, cacheHitRate: 82 }
                ];
                break;
                
            case 'distribution':
                // 访问分布
                data = [
                    { time: '00:00', count: 15 },
                    { time: '02:00', count: 8 },
                    { time: '04:00', count: 5 },
                    { time: '06:00', count: 12 },
                    { time: '08:00', count: 56 },
                    { time: '10:00', count: 89 },
                    { time: '12:00', count: 72 },
                    { time: '14:00', count: 85 },
                    { time: '16:00', count: 91 },
                    { time: '18:00', count: 63 },
                    { time: '20:00', count: 48 },
                    { time: '22:00', count: 25 }
                ];
                break;
                
            case 'errors':
                // 错误数据
                data = [
                    { id: 1, path: '/dashboard', errorCount: 12, errorRate: 0.5, lastError: new Date().toISOString() },
                    { id: 2, path: '/transactions', errorCount: 28, errorRate: 1.2, lastError: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
                    { id: 3, path: '/statistics', errorCount: 18, errorRate: 0.8, lastError: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
                ];
                break;
                
            case 'cache':
                // 缓存数据
                data = [
                    { id: 1, path: '/dashboard', cacheHits: 458, cacheMisses: 56, hitRate: 89 },
                    { id: 2, path: '/transactions', cacheHits: 325, cacheMisses: 102, hitRate: 76 },
                    { id: 3, path: '/statistics', cacheHits: 215, cacheMisses: 132, hitRate: 62 },
                    { id: 4, path: '/settings', cacheHits: 120, cacheMisses: 8, hitRate: 94 }
                ];
                break;
                
            default:
                throw new APIError(400, '不支持的可视化数据类型');
        }
        
        res.json({ type, data });
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(500, '获取路由可视化数据失败');
    }
}
