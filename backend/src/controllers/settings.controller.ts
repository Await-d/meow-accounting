import {Request, Response} from 'express';
import * as settingsModel from '../models/settings';
import {UserSettings} from '../types/index';

// 获取用户设置
export async function getSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        const settings = await settingsModel.getSettings(userId);
        if (!settings) {
            // 返回默认设置
            return res.json({
                theme: 'system',
                language: 'zh-CN',
                appearance: {
                    fontSize: 16,
                    animationSpeed: 300,
                    density: 'comfortable'
                },
                performance: {
                    prefetch: true,
                    cacheSize: 50,
                    reducedAnimations: false
                },
                notifications: {
                    email: true,
                    push: true,
                    desktop: true,
                    summary: 'daily'
                }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('获取用户设置失败:', error);
        res.status(500).json({error: '获取用户设置失败'});
    }
}

// 更新用户设置
export async function updateSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        const settings: Partial<UserSettings> = req.body;
        await settingsModel.updateSettings(userId, settings);

        res.json({message: '设置更新成功'});
    } catch (error) {
        console.error('更新用户设置失败:', error);
        res.status(500).json({error: '更新用户设置失败'});
    }
}

// 重置用户设置
export async function resetSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        await settingsModel.resetSettings(userId);
        res.json({message: '设置已重置'});
    } catch (error) {
        console.error('重置用户设置失败:', error);
        res.status(500).json({error: '重置用户设置失败'});
    }
}

// 导出用户设置
export async function exportSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        const settings = await settingsModel.getSettings(userId);
        if (!settings) {
            return res.status(404).json({error: '设置不存在'});
        }

        res.json(settings);
    } catch (error) {
        console.error('导出用户设置失败:', error);
        res.status(500).json({error: '导出用户设置失败'});
    }
}

// 导入用户设置
export async function importSettings(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: '未登录'});
        }

        const settings: UserSettings = req.body;
        await settingsModel.updateSettings(userId, settings);

        res.json({message: '设置导入成功'});
    } catch (error) {
        console.error('导入用户设置失败:', error);
        res.status(500).json({error: '导入用户设置失败'});
    }
}
