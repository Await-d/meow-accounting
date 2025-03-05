import db from './db';
import bcrypt from 'bcryptjs';

export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    created_at: string;
    updated_at: string;
}

// 创建用户表
export function createUserTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    return new Promise<void>((resolve, reject) => {
        db.run(sql, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

// 检查是否存在用户
export async function hasAnyUser(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM users';

        db.get(sql, (err, row: { count: number }) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row.count > 0);
        });
    });
}

// 创建用户
export async function createUser(username: string, email: string, password: string): Promise<number> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const hasUsers = await hasAnyUser();
    const role = hasUsers ? 'user' : 'admin';

    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `;

        db.run(sql, [username, email, hashedPassword, role], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.lastID);
        });
    });
}

// 通过邮箱查找用户
export async function findUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email = ?';

        db.get(sql, [email], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row || null);
        });
    });
}

// 通过ID查找用户
export async function findUserById(id: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE id = ?';

        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row || null);
        });
    });
}

// 更新用户信息
export function updateUser(id: number, data: Partial<User>): Promise<void> {
    const { username, email, password } = data;
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

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = ?
        `;

        db.run(sql, values, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

// 验证密码
export async function verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
} 