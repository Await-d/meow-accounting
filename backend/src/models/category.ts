import db from './db';

// 分类类型定义
export interface Category {
    id: number;
    name: string;
    icon?: string;
    type: 'income' | 'expense';
    family_id: number | null;
    is_default: boolean;
    created_at: string;
}

// 创建分类表
export async function createCategoryTable() {
    // 先删除旧表
    const dropTableSql = `DROP TABLE IF EXISTS categories`;

    const createTableSql = `
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
            family_id INTEGER,
            is_default BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
        )
    `;

    // 默认分类数据
    const defaultCategories: Array<Omit<Category, 'id' | 'created_at'>> = [
        // 支出分类
        { name: '餐饮', icon: '🍚', type: 'expense', family_id: null, is_default: true },
        { name: '交通', icon: '🚗', type: 'expense', family_id: null, is_default: true },
        { name: '购物', icon: '🛒', type: 'expense', family_id: null, is_default: true },
        { name: '娱乐', icon: '🎮', type: 'expense', family_id: null, is_default: true },
        { name: '居住', icon: '🏠', type: 'expense', family_id: null, is_default: true },
        { name: '医疗', icon: '💊', type: 'expense', family_id: null, is_default: true },
        { name: '教育', icon: '📚', type: 'expense', family_id: null, is_default: true },
        { name: '通讯', icon: '📱', type: 'expense', family_id: null, is_default: true },
        { name: '服饰', icon: '👔', type: 'expense', family_id: null, is_default: true },
        { name: '其他支出', icon: '💰', type: 'expense', family_id: null, is_default: true },
        // 收入分类
        { name: '工资', icon: '💵', type: 'income', family_id: null, is_default: true },
        { name: '奖金', icon: '🎁', type: 'income', family_id: null, is_default: true },
        { name: '投资', icon: '📈', type: 'income', family_id: null, is_default: true },
        { name: '兼职', icon: '💼', type: 'income', family_id: null, is_default: true },
        { name: '其他收入', icon: '💰', type: 'income', family_id: null, is_default: true },
    ];

    try {
        await db.beginTransaction();

        // 删除旧表
        await db.execute(dropTableSql);
        console.log('旧分类表删除成功');

        // 创建新表
        await db.execute(createTableSql);
        console.log('分类表创建成功');

        // 插入默认分类
        const insertSql = `
            INSERT INTO categories (name, icon, type, family_id, is_default)
            VALUES (?, ?, ?, ?, ?)
        `;

        for (const category of defaultCategories) {
            await db.execute(insertSql, [
                category.name,
                category.icon,
                category.type,
                category.family_id,
                category.is_default
            ]);
        }

        await db.commit();
        console.log('默认分类创建成功');
    } catch (error) {
        await db.rollback();
        console.error('创建分类表失败:', error);
        throw error;
    }
}

// 创建分类
export async function createCategory(data: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const sql = `
        INSERT INTO categories (name, icon, type, family_id, is_default)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        const id = await db.insert(sql, [
            data.name,
            data.icon,
            data.type,
            data.family_id,
            data.is_default || false
        ]);

        return {
            id,
            ...data,
            created_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('创建分类失败:', error);
        throw error;
    }
}

// 获取默认分类
export async function getDefaultCategories(): Promise<Category[]> {
    return await db.findMany<Category>('SELECT * FROM categories WHERE is_default = 1');
}

// 获取家庭的所有分类（包括默认分类和自定义分类）
export async function getFamilyCategories(familyId: number): Promise<Category[]> {
    console.log(`执行getFamilyCategories查询，familyId=${familyId}`);
    const sql = `
        SELECT * FROM categories 
        WHERE is_default = 1 OR family_id = ?
        ORDER BY is_default DESC, created_at ASC
    `;

    const results = await db.findMany<Category>(sql, [familyId]);
    console.log(`getFamilyCategories查询结果:`, results);
    return results;
}

// 获取家庭的所有分类
export async function getCategoriesByFamilyId(family_id: number): Promise<Category[]> {
    const sql = `
        SELECT * FROM categories
        WHERE family_id = ?
        ORDER BY type, name
    `;

    try {
        return await db.findMany<Category>(sql, [family_id]);
    } catch (error) {
        console.error('获取分类列表失败:', error);
        throw error;
    }
}

// 更新分类
export async function updateCategory(id: number, data: Partial<Pick<Category, 'name' | 'icon' | 'type'>>, isAdmin: boolean = false): Promise<Category | null> {
    const updates: string[] = [];
    const values: any[] = [];

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

    if (updates.length === 0) {
        return null;
    }

    // 如果是管理员，允许修改默认分类
    const whereClause = isAdmin ? 'id = ?' : 'id = ? AND is_default = 0';

    const sql = `
        UPDATE categories 
        SET ${updates.join(', ')}
        WHERE ${whereClause}
    `;
    values.push(id);

    try {
        await db.execute(sql, values);
        return getCategoryById(id);
    } catch (error) {
        console.error('更新分类失败:', error);
        throw error;
    }
}

// 删除分类
export async function deleteCategory(id: number, isAdmin: boolean = false): Promise<void> {
    // 如果是管理员，允许删除默认分类
    const whereClause = isAdmin ? 'id = ?' : 'id = ? AND is_default = 0';
    const sql = `DELETE FROM categories WHERE ${whereClause}`;

    try {
        await db.execute(sql, [id]);
    } catch (error) {
        console.error('删除分类失败:', error);
        throw error;
    }
}

// 获取单个分类
export async function getCategoryById(id: number): Promise<Category | null> {
    return await db.findOne<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

// 检查分类是否存在
export async function categoryExists(id: number): Promise<boolean> {
    const result = await db.findOne<{ id: number }>('SELECT id FROM categories WHERE id = ?', [id]);
    return !!result;
}

// 检查分类是否属于指定家庭
export async function isCategoryInFamily(category_id: number, family_id: number): Promise<boolean> {
    const sql = `
        SELECT COUNT(*) as count
        FROM categories
        WHERE id = ? AND family_id = ?
    `;

    const result = await db.findOne<{ count: number }>(sql, [category_id, family_id]);
    return (result?.count ?? 0) > 0;
}

// 检查用户是否有权限操作分类
export async function canUserModifyCategory(category_id: number, user_id: number): Promise<boolean> {
    const sql = `
        SELECT COUNT(*) as count
        FROM categories c
        JOIN family_members fm ON c.family_id = fm.family_id
        WHERE c.id = ? AND fm.user_id = ?
    `;

    const result = await db.findOne<{ count: number }>(sql, [category_id, user_id]);
    return (result?.count ?? 0) > 0;
}

// 检查用户是否是某个家庭的成员
export async function isUserInFamily(user_id: number, family_id: number): Promise<boolean> {
    const sql = `
        SELECT COUNT(*) as count
        FROM family_members
        WHERE user_id = ? AND family_id = ?
    `;

    const result = await db.findOne<{ count: number }>(sql, [user_id, family_id]);
    return (result?.count ?? 0) > 0;
}