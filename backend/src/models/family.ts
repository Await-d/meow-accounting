import db from './db';
import {createCategory} from './category';

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
export function createFamilyTables() {
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

    return new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run(familyTableSql, (err: Error | null) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.run(memberTableSql, (err: Error | null) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    db.run(invitationTableSql, (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                });
            });
        });
    });
}

// 默认分类列表
const defaultCategories = [
    // 支出分类
    {name: '餐饮', icon: '🍚', type: 'expense'},
    {name: '交通', icon: '🚗', type: 'expense'},
    {name: '购物', icon: '🛒', type: 'expense'},
    {name: '娱乐', icon: '🎮', type: 'expense'},
    {name: '居住', icon: '🏠', type: 'expense'},
    {name: '医疗', icon: '💊', type: 'expense'},
    {name: '教育', icon: '📚', type: 'expense'},
    {name: '通讯', icon: '📱', type: 'expense'},
    {name: '服饰', icon: '👔', type: 'expense'},
    {name: '其他支出', icon: '💰', type: 'expense'},
    // 收入分类
    {name: '工资', icon: '💵', type: 'income'},
    {name: '奖金', icon: '🎁', type: 'income'},
    {name: '投资', icon: '📈', type: 'income'},
    {name: '兼职', icon: '💼', type: 'income'},
    {name: '其他收入', icon: '💰', type: 'income'},
] as const;

// 创建家庭
export function createFamily(name: string, description: string, ownerId: number): Promise<number> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run(
                'INSERT INTO families (name, description, owner_id) VALUES (?, ?, ?)',
                [name, description, ownerId],
                async function (this: { lastID: number }, err: Error | null) {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    const familyId = this.lastID;

                    try {
                        // 添加创建者作为家庭成员（owner角色）
                        await new Promise<void>((resolve, reject) => {
                            db.run(
                                'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
                                [familyId, ownerId, 'owner'],
                                (err: Error | null) => {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        });

                        db.run('COMMIT');
                        resolve(familyId);
                    } catch (error) {
                        db.run('ROLLBACK');
                        reject(error);
                    }
                }
            );
        });
    });
}

// 获取家庭信息
export function getFamilyById(id: number): Promise<Family | undefined> {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM families WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row as Family);
        });
    });
}

// 获取用户的所有家庭
export function getUserFamilies(userId: number): Promise<Family[]> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT f.* 
            FROM families f
            JOIN family_members fm ON f.id = fm.family_id
            WHERE fm.user_id = ?
        `;

        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows as Family[]);
        });
    });
}

// 获取家庭成员
export function getFamilyMembers(familyId: number): Promise<FamilyMember[]> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT fm.*, u.username, u.email
            FROM family_members fm
            JOIN users u ON fm.user_id = u.id
            WHERE fm.family_id = ?
        `;

        db.all(sql, [familyId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows as FamilyMember[]);
        });
    });
}

// 添加家庭成员
export function addFamilyMember(familyId: number, userId: number, role: 'admin' | 'member' = 'member'): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)';

        db.run(sql, [familyId, userId, role], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

// 更新成员角色
export function updateMemberRole(familyId: number, userId: number, role: 'admin' | 'member'): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE family_members 
            SET role = ?
            WHERE family_id = ? AND user_id = ? AND role != 'owner'
        `;

        db.run(sql, [role, familyId, userId], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

// 移除家庭成员
export function removeFamilyMember(familyId: number, userId: number, currentUserId?: number): Promise<void> {
    return new Promise((resolve, reject) => {
        // 如果是自己退出家庭，或者是管理员移除成员
        const sql = currentUserId === userId
            ? `DELETE FROM family_members WHERE family_id = ? AND user_id = ? AND role != 'owner'`
            : `DELETE FROM family_members WHERE family_id = ? AND user_id = ? AND role != 'owner'`;

        db.run(sql, [familyId, userId], function (this: { changes: number }, err) {
            if (err) {
                reject(err);
                return;
            }

            // 检查是否有记录被删除
            if (this.changes === 0) {
                console.log(`没有记录被删除: familyId=${familyId}, userId=${userId}`);
            } else {
                console.log(`成功删除记录: familyId=${familyId}, userId=${userId}, 影响行数: ${this.changes}`);
            }

            resolve();
        });
    });
}

// 检查用户是否是家庭成员
export function isFamilyMember(familyId: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ?';

        db.get(sql, [familyId, userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(!!row);
        });
    });
}

// 检查用户是否是家庭管理员
export function isFamilyAdmin(familyId: number, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 1 FROM family_members 
            WHERE family_id = ? AND user_id = ? AND role IN ('owner', 'admin')
        `;

        db.get(sql, [familyId, userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(!!row);
        });
    });
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
export function createFamilyInvitation(
    familyId: number,
    email: string | null,
    role: 'admin' | 'member',
    createdBy: number,
    expiresInHours = 48,
    maxUses = 1
): Promise<{ id: number; token: string }> {
    return new Promise((resolve, reject) => {
        // 生成过期时间（当前时间 + expiresInHours小时）
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        // 生成唯一令牌
        const token = generateToken();

        const sql = `
            INSERT INTO family_invitations 
            (family_id, email, role, token, expires_at, created_by, max_uses, current_uses) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [familyId, email, role, token, expiresAt.toISOString(), createdBy, maxUses, 0],
            function (this: { lastID: number }, err: Error | null) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({id: this.lastID, token});
            }
        );
    });
}

// 获取邀请信息
export function getInvitationByToken(token: string): Promise<FamilyInvitation | undefined> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT i.*, f.name as family_name
            FROM family_invitations i
            JOIN families f ON i.family_id = f.id
            WHERE i.token = ?
        `;

        db.get(sql, [token], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row as FamilyInvitation | undefined);
        });
    });
}

// 获取用户的所有待处理邀请
export function getPendingInvitationsByEmail(email: string): Promise<FamilyInvitation[]> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT i.*, f.name as family_name, u.username as creator_name, u.email as creator_email
            FROM family_invitations i
            JOIN families f ON i.family_id = f.id
            JOIN users u ON i.created_by = u.id
            WHERE (i.email = ? OR i.email IS NULL) 
            AND i.status = 'pending' 
            AND i.expires_at > datetime('now')
            ORDER BY i.created_at DESC
        `;

        db.all(sql, [email], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows as FamilyInvitation[]);
        });
    });
}

// 接受邀请
export function acceptInvitation(token: string, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // 获取邀请信息
            db.get(
                'SELECT * FROM family_invitations WHERE token = ? AND status = "pending" AND expires_at > datetime("now")',
                [token],
                (err, invitation: FamilyInvitation) => {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    if (!invitation) {
                        db.run('ROLLBACK');
                        reject(new Error('邀请不存在或已过期'));
                        return;
                    }

                    // 如果邀请指定了邮箱，检查邮箱是否匹配
                    if (invitation.email) {
                        db.get('SELECT email FROM users WHERE id = ?', [userId], (err, user: { email: string }) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            if (!user || user.email !== invitation.email) {
                                db.run('ROLLBACK');
                                reject(new Error('此邀请不是发送给您的'));
                                return;
                            }

                            // 继续处理邀请
                            processInvitation(invitation);
                        });
                    } else {
                        // 通用邀请，无需检查邮箱
                        processInvitation(invitation);
                    }

                    function processInvitation(invitation: FamilyInvitation) {
                        // 检查用户是否已经是家庭成员
                        db.get(
                            'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
                            [invitation.family_id, userId],
                            (err, member) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }

                                if (member) {
                                    // 用户已经是家庭成员，更新邀请状态
                                    updateInvitationStatus();
                                    return;
                                }

                                // 添加用户为家庭成员
                                db.run(
                                    'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
                                    [invitation.family_id, userId, invitation.role],
                                    (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }

                                        // 更新邀请状态
                                        updateInvitationStatus();
                                    }
                                );
                            }
                        );

                        function updateInvitationStatus() {
                            // 对于多次使用的邀请，增加使用次数而不是标记为已接受
                            if (invitation.max_uses > 1) {
                                const newCurrentUses = (invitation.current_uses || 0) + 1;
                                const newStatus = newCurrentUses >= invitation.max_uses ? 'accepted' : 'pending';

                                db.run(
                                    'UPDATE family_invitations SET current_uses = ?, status = ? WHERE token = ?',
                                    [newCurrentUses, newStatus, token],
                                    (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }
                                        db.run('COMMIT');
                                        resolve();
                                    }
                                );
                            } else {
                                // 单次使用的邀请，直接标记为已接受
                                db.run(
                                    'UPDATE family_invitations SET status = "accepted", current_uses = 1 WHERE token = ?',
                                    [token],
                                    (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }
                                        db.run('COMMIT');
                                        resolve();
                                    }
                                );
                            }
                        }
                    }
                }
            );
        });
    });
}

// 拒绝邀请
export function rejectInvitation(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE family_invitations 
            SET status = "rejected" 
            WHERE token = ? AND status = "pending"
        `;

        db.run(sql, [token], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

// 清理过期邀请
export function cleanupExpiredInvitations(): Promise<number> {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE family_invitations 
            SET status = "expired" 
            WHERE status = "pending" AND expires_at < datetime('now')
        `;

        db.run(sql, function (this: { changes: number }, err: Error | null) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
}

// 获取家庭的所有邀请
export function getFamilyInvitations(familyId: number): Promise<FamilyInvitation[]> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT i.*, u.username as creator_name, u.email as creator_email
            FROM family_invitations i
            JOIN users u ON i.created_by = u.id
            WHERE i.family_id = ?
            ORDER BY i.created_at DESC
        `;

        db.all(sql, [familyId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows as FamilyInvitation[]);
        });
    });
}

// 删除邀请
export function deleteInvitation(invitationId: number, familyId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        // 首先检查邀请是否存在
        const checkSql = `
            SELECT id, status FROM family_invitations 
            WHERE id = ? AND family_id = ?
        `;

        db.get(checkSql, [invitationId, familyId], (err, invitation) => {
            if (err) {
                reject(err);
                return;
            }

            if (!invitation) {
                console.log(`邀请不存在: invitationId=${invitationId}, familyId=${familyId}`);
                reject(new Error('邀请不存在'));
                return;
            }

            // 删除邀请，不限制状态
            const deleteSql = `
                DELETE FROM family_invitations 
                WHERE id = ? AND family_id = ?
            `;

            db.run(deleteSql, [invitationId, familyId], function (this: { changes: number }, err) {
                if (err) {
                    reject(err);
                    return;
                }

                // 检查是否有记录被删除
                if (this.changes === 0) {
                    console.log(`没有邀请被删除: invitationId=${invitationId}, familyId=${familyId}`);
                    reject(new Error('删除邀请失败'));
                    return;
                }

                console.log(`成功删除邀请: invitationId=${invitationId}, familyId=${familyId}, 状态=${invitation.status}`);
                resolve();
            });
        });
    });
}

// 更新家庭信息
export function updateFamily(id: number, name: string, description: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE families 
            SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        db.run(sql, [name, description, id], (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

// 删除家庭
export function deleteFamily(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // 删除家庭邀请
            db.run('DELETE FROM family_invitations WHERE family_id = ?', [id], (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }

                // 删除家庭成员
                db.run('DELETE FROM family_members WHERE family_id = ?', [id], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    // 删除家庭
                    db.run('DELETE FROM families WHERE id = ?', [id], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }

                        db.run('COMMIT');
                        resolve();
                    });
                });
            });
        });
    });
}
