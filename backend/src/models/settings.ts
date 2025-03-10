import { db } from '../config/database';
import { UserSettings } from '../types';

// 默认设置
const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
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
};

// 获取用户设置
export async function getSettings(userId: number): Promise<UserSettings | null> {
    const settings = await db.get<UserSettings>(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [userId]
    );

    if (!settings) {
        return null;
    }

    return {
        ...settings,
        appearance: JSON.parse(settings.appearance as unknown as string),
        performance: JSON.parse(settings.performance as unknown as string),
        notifications: JSON.parse(settings.notifications as unknown as string)
    };
}

// 更新用户设置
export async function updateSettings(
    userId: number,
    settings: Partial<UserSettings>
): Promise<void> {
    const current = await getSettings(userId);

    if (!current) {
        // 创建新设置
        const newSettings = {
            ...DEFAULT_SETTINGS,
            ...settings
        };

        await db.run(
            `INSERT INTO user_settings (
                user_id, theme, language, appearance,
                performance, notifications
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                newSettings.theme,
                newSettings.language,
                JSON.stringify(newSettings.appearance),
                JSON.stringify(newSettings.performance),
                JSON.stringify(newSettings.notifications)
            ]
        );
    } else {
        // 更新现有设置
        const updatedSettings = {
            ...current,
            ...settings,
            appearance: {
                ...current.appearance,
                ...(settings.appearance || {})
            },
            performance: {
                ...current.performance,
                ...(settings.performance || {})
            },
            notifications: {
                ...current.notifications,
                ...(settings.notifications || {})
            }
        };

        await db.run(
            `UPDATE user_settings 
            SET theme = ?,
                language = ?,
                appearance = ?,
                performance = ?,
                notifications = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?`,
            [
                updatedSettings.theme,
                updatedSettings.language,
                JSON.stringify(updatedSettings.appearance),
                JSON.stringify(updatedSettings.performance),
                JSON.stringify(updatedSettings.notifications),
                userId
            ]
        );
    }
}

// 重置用户设置
export async function resetSettings(userId: number): Promise<void> {
    await db.run(
        `UPDATE user_settings 
        SET theme = ?,
            language = ?,
            appearance = ?,
            performance = ?,
            notifications = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [
            DEFAULT_SETTINGS.theme,
            DEFAULT_SETTINGS.language,
            JSON.stringify(DEFAULT_SETTINGS.appearance),
            JSON.stringify(DEFAULT_SETTINGS.performance),
            JSON.stringify(DEFAULT_SETTINGS.notifications),
            userId
        ]
    );
}

// 导出用户设置
export async function exportSettings(userId: number): Promise<string> {
    const settings = await getSettings(userId);
    if (!settings) {
        throw new Error('设置不存在');
    }

    return JSON.stringify(settings);
}

// 导入用户设置
export async function importSettings(
    userId: number,
    settingsJson: string
): Promise<void> {
    try {
        const settings = JSON.parse(settingsJson);
        await updateSettings(userId, settings);
    } catch (error) {
        throw new Error('无效的设置数据');
    }
}

// 批量更新用户设置
export async function bulkUpdateSettings(
    settings: Array<{
        userId: number;
        settings: Partial<UserSettings>;
    }>
): Promise<void> {
    for (const item of settings) {
        await updateSettings(item.userId, item.settings);
    }
}

// 获取设置历史记录
export async function getSettingsHistory(
    userId: number,
    limit: number = 10
): Promise<Array<{
    settings: UserSettings;
    created_at: string;
}>> {
    const results = await db.all<Array<{
        settings: string;
        created_at: string;
    }>>(
        `SELECT settings, created_at 
        FROM user_settings_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?`,
        [userId, limit]
    );

    return results.map(result => ({
        settings: JSON.parse(result.settings),
        created_at: result.created_at
    }));
} 