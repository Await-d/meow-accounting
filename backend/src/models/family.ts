/*
 * @Author: Await
 * @Date: 2025-03-15 17:15:45
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 17:15:45
 * @Description: 家庭模型
 */
import { db } from '../config/database';
import * as categoryModel from './category';

export interface Family {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
}

export interface FamilyMember {
    id: number;
    family_id: number;
    user_id: number;
    role: 'owner' | 'admin' | 'member';
    created_at: string;
}

export interface FamilyInvitation {
    id: number;
    family_id: number;
    email: string | null;
    role: 'admin' | 'member';
    token: string;
    expires_at: string;
    created_at: string;
    created_by: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    max_uses: number;
    current_uses: number;
}

// 创建家庭表
export async function createFamilyTables(): Promise<void> {
    const familyTableSql = `
        CREATE TABLE IF NOT EXISTS families (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            owner_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users (id)
        )
    `;

    const memberTableSql = `
        CREATE TABLE IF NOT EXISTS family_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT CHECK(role IN ('owner', 'admin', 'member')) NOT NULL DEFAULT 'member',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (family_id) REFERENCES families (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE (family_id, user_id)
        )
    `;

    const invitationTableSql = `
        CREATE TABLE IF NOT EXISTS family_invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            email TEXT,
            role TEXT CHECK(role IN ('admin', 'member')) NOT NULL DEFAULT 'member',
            token TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'accepted', 'rejected', 'expired')) NOT NULL DEFAULT 'pending',
            max_uses INTEGER NOT NULL DEFAULT 1,
            current_uses INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (family_id) REFERENCES families (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `;

    try {
        await db.beginTransaction();

        // 创建家庭表
        await db.execute(familyTableSql);

        // 创建家庭成员表
        await db.execute(memberTableSql);

        // 创建邀请表
        await db.execute(invitationTableSql);

        await db.commit();
    } catch (error) {
        await db.rollback();
        throw error;
    }
}

// 默认分类列表
const defaultCategories = [
    // 支出分类
    { name: '餐饮', icon: '🍚', type: 'expense' },
    { name: '交通', icon: '🚗', type: 'expense' },
    { name: '购物', icon: '🛒', type: 'expense' },
    { name: '娱乐', icon: '🎮', type: 'expense' },
    { name: '居住', icon: '🏠', type: 'expense' },
    { name: '医疗', icon: '💊', type: 'expense' },
    { name: '教育', icon: '📚', type: 'expense' },
    { name: '通讯', icon: '📱', type: 'expense' },
    { name: '服饰', icon: '👔', type: 'expense' },
    { name: '其他支出', icon: '💰', type: 'expense' },
    // 收入分类
    { name: '工资', icon: '💵', type: 'income' },
    { name: '奖金', icon: '🎁', type: 'income' },
    { name: '投资', icon: '📈', type: 'income' },
    { name: '兼职', icon: '💼', type: 'income' },
    { name: '其他收入', icon: '💰', type: 'income' },
] as const;

// 创建家庭
export async function createFamily(name: string, description: string, ownerId: number): Promise<number> {
    try {
        await db.beginTransaction();

        // 创建家庭
        const result = await db.insert(
            'INSERT INTO families (name, description, owner_id) VALUES (?, ?, ?)',
            [name, description, ownerId]
        );

        const familyId = result;

        // 添加创建者作为家庭成员（owner角色）
        await db.execute(
            'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
            [familyId, ownerId, 'owner']
        );

        await db.commit();
        return familyId;
    } catch (error) {
        await db.rollback();
        throw error;
    }
}

// 获取家庭信息
export async function getFamilyById(id: number): Promise<Family | undefined> {
    const result = await db.findOne<Family>('SELECT * FROM families WHERE id = ?', [id]);
    return result || undefined;
}

// 获取用户的所有家庭
export async function getUserFamilies(userId: number): Promise<Family[]> {
    const sql = `
        SELECT f.* 
        FROM families f
        JOIN family_members fm ON f.id = fm.family_id
        WHERE fm.user_id = ?
    `;
    return await db.findMany<Family>(sql, [userId]);
}

// 获取家庭成员
export async function getFamilyMembers(familyId: number): Promise<FamilyMember[]> {
    const sql = `
        SELECT fm.*, u.id as user_id, u.email
        FROM family_members fm
        JOIN users u ON fm.user_id = u.id
        WHERE fm.family_id = ?
    `;
    return await db.findMany<FamilyMember>(sql, [familyId]);
}

// 添加家庭成员
export async function addFamilyMember(familyId: number, userId: number, role: 'admin' | 'member' = 'member'): Promise<void> {
    await db.execute(
        'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
        [familyId, userId, role]
    );
}

// 更新成员角色
export async function updateMemberRole(familyId: number, userId: number, role: 'admin' | 'member'): Promise<void> {
    await db.execute(
        `UPDATE family_members 
         SET role = ?
         WHERE family_id = ? AND user_id = ? AND role != 'owner'`,
        [role, familyId, userId]
    );
}

// 移除家庭成员
export async function removeFamilyMember(familyId: number, userId: number, currentUserId?: number): Promise<void> {
    // 如果指定了当前用户ID，需要检查权限
    if (currentUserId) {
        const currentUserRole = await db.findOne<{ role: string }>(
            'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, currentUserId]
        );

        // 只有管理员或所有者可以移除成员
        if (!currentUserRole || (currentUserRole.role !== 'admin' && currentUserRole.role !== 'owner')) {
            throw new Error('没有权限执行此操作');
        }

        // 不能移除所有者
        const targetRole = await db.findOne<{ role: string }>(
            'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, userId]
        );

        if (targetRole?.role === 'owner') {
            throw new Error('不能移除家庭所有者');
        }
    }

    await db.execute(
        'DELETE FROM family_members WHERE family_id = ? AND user_id = ? AND role != "owner"',
        [familyId, userId]
    );
}

// 检查是否是家庭成员
export async function isFamilyMember(familyId: number, userId: number): Promise<boolean> {
    const member = await db.findOne<{ id: number }>(
        'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
    );
    return !!member;
}

// 检查是否是家庭管理员
export async function isFamilyAdmin(familyId: number, userId: number): Promise<boolean> {
    const member = await db.findOne<{ role: string }>(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
    );
    return member?.role === 'admin' || member?.role === 'owner';
}

// 生成随机令牌
function generateToken(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// 创建家庭邀请
export async function createFamilyInvitation(
    familyId: number,
    email: string | null,
    role: 'admin' | 'member',
    createdBy: number,
    expiresInHours = 48,
    maxUses = 1
): Promise<{ id: number; token: string }> {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    const id = await db.insert(
        `INSERT INTO family_invitations (
            family_id, email, role, token, expires_at, created_by, max_uses
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [familyId, email, role, token, expiresAt, createdBy, maxUses]
    );

    return { id, token };
}

// 通过令牌获取邀请
export async function getInvitationByToken(token: string): Promise<FamilyInvitation | undefined> {
    const invitation = await db.findOne<FamilyInvitation>(
        'SELECT * FROM family_invitations WHERE token = ?',
        [token]
    );
    return invitation || undefined;
}

// 获取用户的待处理邀请
export async function getPendingInvitationsByEmail(email: string): Promise<FamilyInvitation[]> {
    const sql = `
        SELECT i.*, f.name as family_name, u.id as creator_id
        FROM family_invitations i
        JOIN families f ON i.family_id = f.id
        JOIN users u ON i.created_by = u.id
        WHERE i.email = ? AND i.status = 'pending' AND i.expires_at > CURRENT_TIMESTAMP
    `;
    return await db.findMany<FamilyInvitation>(sql, [email]);
}

// 接受邀请
export async function acceptInvitation(token: string, userId: number): Promise<void> {
    try {
        await db.beginTransaction();

        // 获取邀请信息
        const invitation = await db.findOne<FamilyInvitation>(
            'SELECT * FROM family_invitations WHERE token = ? AND status = "pending"',
            [token]
        );

        if (!invitation) {
            throw new Error('邀请不存在或已过期');
        }

        if (invitation.expires_at < new Date().toISOString()) {
            throw new Error('邀请已过期');
        }

        if (invitation.current_uses >= invitation.max_uses) {
            throw new Error('邀请已达到最大使用次数');
        }

        // 检查用户是否已经是家庭成员
        const existingMember = await db.findOne<{ id: number }>(
            'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
            [invitation.family_id, userId]
        );

        if (existingMember) {
            throw new Error('用户已经是该家庭的成员');
        }

        // 添加用户为家庭成员
        await db.execute(
            'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
            [invitation.family_id, userId, invitation.role]
        );

        // 更新邀请使用次数
        await db.execute(
            'UPDATE family_invitations SET current_uses = current_uses + 1 WHERE id = ?',
            [invitation.id]
        );

        // 如果达到最大使用次数，将状态更新为已完成
        if (invitation.current_uses + 1 >= invitation.max_uses) {
            await db.execute(
                'UPDATE family_invitations SET status = "accepted" WHERE id = ?',
                [invitation.id]
            );
        }

        await db.commit();
    } catch (error) {
        await db.rollback();
        throw error;
    }
}

// 拒绝邀请
export async function rejectInvitation(token: string): Promise<void> {
    await db.execute(
        'UPDATE family_invitations SET status = "rejected" WHERE token = ? AND status = "pending"',
        [token]
    );
}

// 清理过期邀请
export async function cleanupExpiredInvitations(): Promise<number> {
    // 先获取需要更新的邀请数量
    const expiredInvitations = await db.findMany<{ id: number }>(
        'SELECT id FROM family_invitations WHERE status = "pending" AND expires_at <= CURRENT_TIMESTAMP'
    );

    if (expiredInvitations.length > 0) {
        await db.execute(
            'UPDATE family_invitations SET status = "expired" WHERE status = "pending" AND expires_at <= CURRENT_TIMESTAMP'
        );
    }

    return expiredInvitations.length;
}

// 获取家庭的所有邀请
export async function getFamilyInvitations(familyId: number): Promise<FamilyInvitation[]> {
    const sql = `
        SELECT i.*, u.id as creator_id
        FROM family_invitations i
        JOIN users u ON i.created_by = u.id
        WHERE i.family_id = ?
        ORDER BY i.created_at DESC
    `;
    return await db.findMany<FamilyInvitation>(sql, [familyId]);
}

// 删除邀请
export async function deleteInvitation(invitationId: number, familyId: number): Promise<void> {
    await db.execute(
        'DELETE FROM family_invitations WHERE id = ? AND family_id = ?',
        [invitationId, familyId]
    );
}

// 更新家庭信息
export async function updateFamily(id: number, name: string, description: string): Promise<void> {
    await db.execute(
        'UPDATE families SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, id]
    );
}

// 删除家庭
export async function deleteFamily(id: number): Promise<void> {
    try {
        await db.beginTransaction();

        // 删除家庭成员
        await db.execute('DELETE FROM family_members WHERE family_id = ?', [id]);

        // 删除家庭邀请
        await db.execute('DELETE FROM family_invitations WHERE family_id = ?', [id]);

        // 删除家庭
        await db.execute('DELETE FROM families WHERE id = ?', [id]);

        await db.commit();
    } catch (error) {
        await db.rollback();
        throw error;
    }
}
