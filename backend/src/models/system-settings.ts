import { db } from '../config/database';

export interface SystemSettings {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    language: string;
    timezone: string;
    enableRegistration: boolean;
    enableEmailNotification: boolean;
    enableSMSNotification: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
    maintenanceMode: boolean;
}

const DEFAULTS: SystemSettings = {
    siteName: '喵呜记账',
    siteDescription: '简单易用的个人和家庭记账系统',
    adminEmail: 'admin@example.com',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    enableRegistration: true,
    enableEmailNotification: true,
    enableSMSNotification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    maintenanceMode: false
};

export async function ensureSystemSettingsTable(): Promise<void> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            site_name TEXT NOT NULL DEFAULT '喵呜记账',
            site_description TEXT NOT NULL DEFAULT '',
            admin_email TEXT NOT NULL DEFAULT 'admin@example.com',
            language TEXT NOT NULL DEFAULT 'zh-CN',
            timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
            enable_registration INTEGER NOT NULL DEFAULT 1,
            enable_email_notification INTEGER NOT NULL DEFAULT 1,
            enable_sms_notification INTEGER NOT NULL DEFAULT 0,
            max_login_attempts INTEGER NOT NULL DEFAULT 5,
            session_timeout INTEGER NOT NULL DEFAULT 30,
            maintenance_mode INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    const existing = await db.findOne<{ id: number }>('SELECT id FROM system_settings WHERE id = 1', []);
    if (!existing) {
        await db.execute(
            `INSERT INTO system_settings (id, site_name, site_description, admin_email, language, timezone,
                enable_registration, enable_email_notification, enable_sms_notification,
                max_login_attempts, session_timeout, maintenance_mode)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                DEFAULTS.siteName, DEFAULTS.siteDescription, DEFAULTS.adminEmail,
                DEFAULTS.language, DEFAULTS.timezone,
                DEFAULTS.enableRegistration ? 1 : 0,
                DEFAULTS.enableEmailNotification ? 1 : 0,
                DEFAULTS.enableSMSNotification ? 1 : 0,
                DEFAULTS.maxLoginAttempts, DEFAULTS.sessionTimeout,
                DEFAULTS.maintenanceMode ? 1 : 0
            ]
        );
    }
}

export async function getSystemSettings(): Promise<SystemSettings> {
    const row = await db.findOne<any>('SELECT * FROM system_settings WHERE id = 1', []);
    if (!row) return { ...DEFAULTS };
    return {
        siteName: row.site_name,
        siteDescription: row.site_description,
        adminEmail: row.admin_email,
        language: row.language,
        timezone: row.timezone,
        enableRegistration: Boolean(row.enable_registration),
        enableEmailNotification: Boolean(row.enable_email_notification),
        enableSMSNotification: Boolean(row.enable_sms_notification),
        maxLoginAttempts: row.max_login_attempts,
        sessionTimeout: row.session_timeout,
        maintenanceMode: Boolean(row.maintenance_mode)
    };
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const current = await getSystemSettings();
    const merged = { ...current, ...settings };
    await db.execute(
        `UPDATE system_settings
         SET site_name = ?, site_description = ?, admin_email = ?, language = ?, timezone = ?,
             enable_registration = ?, enable_email_notification = ?, enable_sms_notification = ?,
             max_login_attempts = ?, session_timeout = ?, maintenance_mode = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = 1`,
        [
            merged.siteName, merged.siteDescription, merged.adminEmail,
            merged.language, merged.timezone,
            merged.enableRegistration ? 1 : 0,
            merged.enableEmailNotification ? 1 : 0,
            merged.enableSMSNotification ? 1 : 0,
            merged.maxLoginAttempts, merged.sessionTimeout,
            merged.maintenanceMode ? 1 : 0
        ]
    );
    return getSystemSettings();
}
