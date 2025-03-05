import { db } from './db';

// 创建分类表
export async function createCategoryTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
            family_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
        )
    `;

    try {
        await db.run(sql);
        console.log('分类表创建成功');
    } catch (error) {
        console.error('创建分类表失败:', error);
        throw error;
    }
}

// 创建分类
export async function createCategory(data: {
    name: string;
    icon?: string;
    type: 'income' | 'expense';
    family_id: number;
}) {
    const sql = `
        INSERT INTO categories (name, icon, type, family_id)
        VALUES (?, ?, ?, ?)
    `;

    try {
        const result = await db.run(sql, [data.name, data.icon, data.type, data.family_id]);
        return {
            id: result.lastID,
            ...data
        };
    } catch (error) {
        console.error('创建分类失败:', error);
        throw error;
    }
}

// 获取家庭的所有分类
export async function getCategoriesByFamilyId(family_id: number) {
    const sql = `
        SELECT * FROM categories
        WHERE family_id = ?
        ORDER BY type, name
    `;

    try {
        return await db.all(sql, [family_id]);
    } catch (error) {
        console.error('获取分类列表失败:', error);
        throw error;
    }
}

// 更新分类
export async function updateCategory(id: number, data: {
    name?: string;
    icon?: string;
    type?: 'income' | 'expense';
}) {
    const updates = [];
    const values = [];

    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }
    if (data.icon !== undefined) {
        updates.push('icon = ?');
        values.push(data.icon);
    }
    if (data.type !== undefined) {
        updates.push('type = ?');
        values.push(data.type);
    }

    if (updates.length === 0) return null;

    const sql = `
        UPDATE categories
        SET ${updates.join(', ')}
        WHERE id = ?
    `;
    values.push(id);

    try {
        await db.run(sql, values);
        return { id, ...data };
    } catch (error) {
        console.error('更新分类失败:', error);
        throw error;
    }
}

// 删除分类
export async function deleteCategory(id: number) {
    const sql = 'DELETE FROM categories WHERE id = ?';

    try {
        await db.run(sql, [id]);
        return true;
    } catch (error) {
        console.error('删除分类失败:', error);
        throw error;
    }
}

// 获取分类详情
export async function getCategoryById(id: number) {
    const sql = 'SELECT * FROM categories WHERE id = ?';

    try {
        return await db.get(sql, [id]);
    } catch (error) {
        console.error('获取分类详情失败:', error);
        throw error;
    }
}

// 检查分类是否属于指定家庭
export async function isCategoryInFamily(category_id: number, family_id: number) {
    const sql = `
        SELECT COUNT(*) as count
        FROM categories
        WHERE id = ? AND family_id = ?
    `;

    try {
        const result = await db.get(sql, [category_id, family_id]);
        return result.count > 0;
    } catch (error) {
        console.error('检查分类所属家庭失败:', error);
        throw error;
    }
} 