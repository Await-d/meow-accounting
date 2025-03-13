import db from './db';
import bcrypt from 'bcryptjs';

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
    nickname?: string;
    avatar?: string;
    currentFamilyId?: number;
    settings?: Record<string, any>;
    privacy_mode: boolean;
    guest_password: string | null;
    created_at: string;
    updated_at: string;
}

// 创建用户表
export async function createUserTable(): Promise<void> {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT,
            avatar TEXT,
            role TEXT DEFAULT 'user',
            current_family_id INTEGER,
            settings JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (current_family_id) REFERENCES families(id)
        )
    `);
}

// 检查是否存在用户
export async function hasAnyUser(): Promise<boolean> {
    const result = await db.findOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    return (result?.count ?? 0) > 0;
}

// 创建用户
export async function createUser(username: string, email: string, password: string): Promise<number> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const hasUsers = await hasAnyUser();
    const role = hasUsers ? 'user' : 'admin';
    const defaultSettings = JSON.stringify({});

    const id = await db.insert(
        `INSERT INTO users (username, email, password, role, nickname, settings)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, role, username, defaultSettings]
    );
    return id;
}

// 通过邮箱查找用户
export async function findUserByEmail(email: string): Promise<User | null> {
    return db.findOne<User>('SELECT * FROM users WHERE email = ?', [email]);
}

// 通过ID查找用户
export async function findUserById(id: string | number): Promise<User | null> {
    return db.findOne<User>('SELECT * FROM users WHERE id = ?', [id]);
}

// 更新用户信息
export async function updateUser(id: string | number, data: Partial<User>): Promise<void> {
    const { username, email, password, privacy_mode, guest_password } = data;
    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
        updates.push('username = ?');
        values.push(username);
    }
    if (email) {
        updates.push('email = ?');
        values.push(email);
    }
    if (password) {
        updates.push('password = ?');
        values.push(password);
    }
    if (privacy_mode !== undefined) {
        updates.push('privacy_mode = ?');
        values.push(privacy_mode ? 1 : 0);
    }
    if (guest_password !== undefined) {
        updates.push('guest_password = ?');
        values.push(guest_password);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.execute(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = ?`,
        values
    );
}

// 验证密码
export async function verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
}

// 删除并重建用户表
export async function rebuildUserTable(): Promise<void> {
    await db.execute('DROP TABLE IF EXISTS users');
    await createUserTable();
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
    // 获取所有用户（不返回敏感信息如密码）
    return db.findMany<User>(
        `SELECT id, username, email, role, nickname, avatar, current_family_id as currentFamilyId, 
         settings, created_at, updated_at
         FROM users ORDER BY id DESC`
    );
}
