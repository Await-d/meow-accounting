import db from './db';

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

    return new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run(familyTableSql, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                db.run(memberTableSql, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
        });
    });
}

// 创建家庭
export function createFamily(name: string, description: string, ownerId: number): Promise<number> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            db.run(
                'INSERT INTO families (name, description, owner_id) VALUES (?, ?, ?)',
                [name, description, ownerId],
                function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    const familyId = this.lastID;

                    // 添加创建者作为家庭成员（owner角色）
                    db.run(
                        'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
                        [familyId, ownerId, 'owner'],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            db.run('COMMIT');
                            resolve(familyId);
                        }
                    );
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
export function removeFamilyMember(familyId: number, userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = `
            DELETE FROM family_members 
            WHERE family_id = ? AND user_id = ? AND role != 'owner'
        `;

        db.run(sql, [familyId, userId], (err) => {
            if (err) {
                reject(err);
                return;
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
        const sql = "SELECT 1 FROM family_members WHERE family_id = ? AND user_id = ? AND role IN ('owner', 'admin')";

        db.get(sql, [familyId, userId], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(!!row);
        });
    });
} 