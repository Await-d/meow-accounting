/*
 * @Author: Await
 * @Date: 2025-03-15 15:25:30
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:25:30
 * @Description: 用户模型
 */
import { db } from '../config/database';
import bcrypt from 'bcrypt';
import { passwordConfig } from '../config/auth';

// 用户接口
export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: string;
    avatar?: string;
    created_at: string;
    updated_at?: string;
}

// 用户更新接口定义
interface UserUpdateData {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    avatar?: string;
    nickname?: string;
}

// 隐私设置接口定义
interface PrivacySettings {
    visibility: 'public' | 'private' | 'custom';
    showTransactions: boolean;
    showStatistics: boolean;
    guestPassword?: string;
}

// 创建用户表
export async function createUserTable() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                avatar TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.execute(sql);
        console.log('用户表创建成功或已存在');
    } catch (error) {
        console.error('创建用户表失败:', error);
        throw error;
    }
}

// 通过ID获取用户
export async function getUserById(id: number): Promise<User | null> {
    try {
        const query = 'SELECT * FROM users WHERE id = ?';
        const user = await db.findOne<User>(query, [id]);
        return user;
    } catch (error) {
        console.error('通过ID获取用户失败:', error);
        throw error;
    }
}

// 通过邮箱获取用户
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        const user = await db.findOne<User>(query, [email]);
        return user;
    } catch (error) {
        console.error('通过邮箱获取用户失败:', error);
        throw error;
    }
}

// 创建用户
export async function createUser(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    avatar?: string;
}): Promise<number> {
    try {
        const { username, email, password, role = 'user', avatar } = userData;

        const sql = `
            INSERT INTO users (username, email, password, role, avatar)
            VALUES (?, ?, ?, ?, ?)
        `;

        const id = await db.insert(sql, [username, email, password, role, avatar]);
        return id;
    } catch (error) {
        console.error('创建用户失败:', error);
        throw error;
    }
}

// 更新用户信息
export async function updateUser(id: number, data: Partial<Omit<User, 'id' | 'created_at'>>): Promise<boolean> {
    try {
        const updates: string[] = [];
        const values: any[] = [];

        if ('username' in data && data.username !== undefined) {
            updates.push('username = ?');
            values.push(data.username);
        }

        if ('email' in data && data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }

        if ('password' in data && data.password !== undefined) {
            updates.push('password = ?');
            values.push(data.password);
        }

        if ('role' in data && data.role !== undefined) {
            updates.push('role = ?');
            values.push(data.role);
        }

        if ('avatar' in data && data.avatar !== undefined) {
            updates.push('avatar = ?');
            values.push(data.avatar);
        }

        if (updates.length === 0) {
            return false;
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const sql = `
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = ?
        `;

        values.push(id);
        await db.execute(sql, values);
        return true;
    } catch (error) {
        console.error('更新用户失败:', error);
        throw error;
    }
}

// 删除用户
export async function deleteUser(id: number): Promise<boolean> {
    try {
        const sql = 'DELETE FROM users WHERE id = ?';
        await db.execute(sql, [id]);
        return true;
    } catch (error) {
        console.error('删除用户失败:', error);
        throw error;
    }
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
    try {
        const sql = 'SELECT id, username, email, role, avatar, created_at, updated_at FROM users';
        const users = await db.findMany<User>(sql);
        return users;
    } catch (error) {
        console.error('获取所有用户失败:', error);
        throw error;
    }
}

// 搜索用户
export async function searchUsers(query: string): Promise<User[]> {
    try {
        const sql = 'SELECT id, username, email, role, avatar, created_at, updated_at FROM users WHERE username LIKE ? OR email LIKE ?';
        const users = await db.findMany<User>(sql, [`%${query}%`, `%${query}%`]);
        return users;
    } catch (error) {
        console.error('搜索用户失败:', error);
        throw error;
    }
}

// 验证密码
export async function verifyPassword(user: User, password: string): Promise<boolean> {
    try {
        return await bcrypt.compare(password, user.password);
    } catch (error) {
        console.error('验证密码失败:', error);
        throw error;
    }
}

// 修改密码
export async function changePassword(userId: number, newPassword: string): Promise<boolean> {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updateUser(userId, { password: hashedPassword });
        return true;
    } catch (error) {
        console.error('修改密码失败:', error);
        throw error;
    }
}

// 更新隐私设置
export const updatePrivacySettings = async (
    userId: number,
    { visibility, showTransactions, showStatistics, guestPassword }: PrivacySettings
): Promise<boolean> => {
    try {
        let hashedGuestPassword = null;
        if (guestPassword) {
            hashedGuestPassword = await bcrypt.hash(guestPassword, 10);
        }

        // 更新设置
        const query = `
            UPDATE user_settings 
            SET visibility = ?, show_transactions = ?, show_statistics = ?, guest_password = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `;

        await db.execute(query, [
            visibility,
            showTransactions ? 1 : 0,
            showStatistics ? 1 : 0,
            hashedGuestPassword,
            userId
        ]);

        // 检查是否存在设置记录，如果不存在则创建
        const settingsExist = await db.getValue<number>('SELECT COUNT(*) FROM user_settings WHERE user_id = ?', [userId]);

        if (!settingsExist) {
            const insertQuery = `
                INSERT INTO user_settings (user_id, visibility, show_transactions, show_statistics, guest_password)
                VALUES (?, ?, ?, ?, ?)
            `;

            await db.execute(insertQuery, [
                userId,
                visibility,
                showTransactions ? 1 : 0,
                showStatistics ? 1 : 0,
                hashedGuestPassword
            ]);
        }

        return true;
    } catch (error) {
        console.error('更新隐私设置失败:', error);
        throw error;
    }
};

// 验证访客密码
export const verifyGuestPassword = async (familyId: number, password: string): Promise<boolean> => {
    try {
        // 获取家庭设置
        const familySettings = await db.findOne<{ guest_password: string }>(
            'SELECT guest_password FROM family_settings WHERE family_id = ?',
            [familyId]
        );

        if (!familySettings || !familySettings.guest_password) {
            return false;
        }

        // 验证密码
        return await bcrypt.compare(password, familySettings.guest_password);
    } catch (error) {
        console.error('验证访客密码失败:', error);
        throw error;
    }
};
