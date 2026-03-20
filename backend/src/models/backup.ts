import { db } from '../config/database';

export interface BackupRecord {
    id: number;
    name: string;
    file_path: string;
    size_bytes: number;
    status: 'created' | 'failed' | 'restored';
    created_by: number;
    created_at: string;
    updated_at: string;
    restored_at?: string | null;
}

export async function createBackupRecord(data: {
    name: string;
    file_path: string;
    size_bytes: number;
    status: 'created' | 'failed' | 'restored';
    created_by: number;
}): Promise<BackupRecord> {
    const now = new Date().toISOString();
    const id = await db.insert(
        `INSERT INTO backups (name, file_path, size_bytes, status, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
        , [data.name, data.file_path, data.size_bytes, data.status, data.created_by, now, now]
    );

    return {
        id,
        name: data.name,
        file_path: data.file_path,
        size_bytes: data.size_bytes,
        status: data.status,
        created_by: data.created_by,
        created_at: now,
        updated_at: now,
        restored_at: null
    };
}

export async function listBackups(userId: number, isAdmin: boolean): Promise<BackupRecord[]> {
    const sql = isAdmin
        ? 'SELECT * FROM backups ORDER BY created_at DESC'
        : 'SELECT * FROM backups WHERE created_by = ? ORDER BY created_at DESC';
    const params = isAdmin ? [] : [userId];
    return db.findMany<BackupRecord>(sql, params);
}

export async function getBackupById(id: number): Promise<BackupRecord | null> {
    return db.findOne<BackupRecord>('SELECT * FROM backups WHERE id = ?', [id]);
}

export async function markBackupRestored(id: number): Promise<void> {
    await db.execute(
        'UPDATE backups SET status = ?, restored_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['restored', id]
    );
}

export async function markBackupFailed(id: number): Promise<void> {
    await db.execute(
        'UPDATE backups SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['failed', id]
    );
}

export async function deleteBackupRecord(id: number): Promise<void> {
    await db.execute('DELETE FROM backups WHERE id = ?', [id]);
}
