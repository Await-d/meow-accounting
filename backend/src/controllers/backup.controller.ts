import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../config/database';
import {
    createBackupRecord,
    listBackups,
    getBackupById,
    markBackupRestored,
    deleteBackupRecord
} from '../models/backup';

const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'data', 'backups');

function sanitizeName(input: string): string {
    return input
        .trim()
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 80) || 'backup';
}

async function ensureBackupDir(): Promise<void> {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
}

function getDbPath(): string {
    const dbPath = process.env.DB_PATH || ':memory:';
    if (dbPath === ':memory:') {
        throw new Error('内存数据库不支持备份/恢复');
    }
    return dbPath;
}

export async function getBackups(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const role = req.user?.role || 'user';
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const backups = await listBackups(userId, role === 'admin');
        res.json(backups);
    } catch (error) {
        console.error('获取备份列表失败:', error);
        res.status(500).json({ error: '获取备份列表失败' });
    }
}

export async function createBackup(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const role = req.user?.role || 'user';
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (role !== 'admin') {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        await ensureBackupDir();

        const name = sanitizeName(req.body?.name || `backup-${new Date().toISOString().slice(0, 10)}`);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${name}-${timestamp}.db`;
        const filePath = path.join(BACKUP_DIR, fileName);

        getDbPath();
        const escapedPath = filePath.replace(/'/g, "''");

        await db.execute(`VACUUM INTO '${escapedPath}'`);

        const stat = await fs.stat(filePath);
        const record = await createBackupRecord({
            name: fileName,
            file_path: filePath,
            size_bytes: stat.size,
            status: 'created',
            created_by: userId
        });

        res.status(201).json(record);
    } catch (error) {
        console.error('创建备份失败:', error);
        res.status(500).json({ error: '创建备份失败' });
    }
}

export async function restoreBackup(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const role = req.user?.role || 'user';
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (role !== 'admin') {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        const backupId = parseInt(req.params.id, 10);
        if (Number.isNaN(backupId)) {
            return res.status(400).json({ error: '无效的备份ID' });
        }

        const record = await getBackupById(backupId);
        if (!record) {
            return res.status(404).json({ error: '备份不存在' });
        }

        await fs.access(record.file_path);

        const dbPath = getDbPath();
        await db.close();
        await fs.copyFile(record.file_path, dbPath);
        await db.connect();

        await markBackupRestored(record.id);
        res.json({ message: '备份恢复成功' });
    } catch (error) {
        console.error('恢复备份失败:', error);
        res.status(500).json({ error: '恢复备份失败' });
    }
}

export async function deleteBackup(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const role = req.user?.role || 'user';
        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (role !== 'admin') {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        const backupId = parseInt(req.params.id, 10);
        if (Number.isNaN(backupId)) {
            return res.status(400).json({ error: '无效的备份ID' });
        }

        const record = await getBackupById(backupId);
        if (!record) {
            return res.status(404).json({ error: '备份不存在' });
        }

        await fs.unlink(record.file_path).catch(() => undefined);
        await deleteBackupRecord(record.id);
        res.json({ message: '备份已删除' });
    } catch (error) {
        console.error('删除备份失败:', error);
        res.status(500).json({ error: '删除备份失败' });
    }
}
