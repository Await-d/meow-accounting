import { Request, Response, NextFunction } from 'express';
import { getSystemSettings, updateSystemSettings, ensureSystemSettingsTable } from '../models/system-settings';
import { APIError } from '../middleware/error';

export const getSystemSettingsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureSystemSettingsTable();
        const settings = await getSystemSettings();
        res.json({ code: 200, data: settings, message: '获取成功' });
    } catch (error) {
        next(error);
    }
};

export const updateSystemSettingsHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new APIError(401, '未授权访问');
        }
        if (req.user.role !== 'admin') {
            throw new APIError(403, '需要管理员权限');
        }
        await ensureSystemSettingsTable();
        const updated = await updateSystemSettings(req.body);
        res.json({ code: 200, data: updated, message: '保存成功' });
    } catch (error) {
        next(error);
    }
};
