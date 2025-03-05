import { db } from './db';

// 创建事务表
export async function createTransactionTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount DECIMAL(10,2) NOT NULL,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
            category_id INTEGER NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            user_id INTEGER NOT NULL,
            family_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
        )
    `;

    try {
        await db.run(sql);
        console.log('事务表创建成功');
    } catch (error) {
        console.error('创建事务表失败:', error);
        throw error;
    }
}

// 创建事务
export async function createTransaction(data: {
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    description?: string;
    date: string;
    user_id: number;
    family_id: number;
}) {
    const sql = `
        INSERT INTO transactions (amount, type, category_id, description, date, user_id, family_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        const result = await db.run(sql, [
            data.amount,
            data.type,
            data.category_id,
            data.description,
            data.date,
            data.user_id,
            data.family_id
        ]);

        return {
            id: result.lastID,
            ...data
        };
    } catch (error) {
        console.error('创建事务失败:', error);
        throw error;
    }
}

// 获取家庭的事务列表
export async function getTransactions(params: {
    family_id: number;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    category_id?: number;
    page?: number;
    pageSize?: number;
}) {
    let conditions = ['family_id = ?'];
    const values = [params.family_id];

    if (params.startDate) {
        conditions.push('date >= ?');
        values.push(params.startDate);
    }
    if (params.endDate) {
        conditions.push('date <= ?');
        values.push(params.endDate);
    }
    if (params.type) {
        conditions.push('type = ?');
        values.push(params.type);
    }
    if (params.category_id) {
        conditions.push('category_id = ?');
        values.push(params.category_id);
    }

    const sql = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, u.username as username
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY date DESC, created_at DESC
        LIMIT ? OFFSET ?
    `;

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    values.push(pageSize, (page - 1) * pageSize);

    try {
        const transactions = await db.all(sql, values);

        // 获取总数
        const countSql = `
            SELECT COUNT(*) as total
            FROM transactions
            WHERE ${conditions.join(' AND ')}
        `;
        const { total } = await db.get(countSql, values.slice(0, -2));

        return {
            data: transactions,
            total,
            page,
            pageSize
        };
    } catch (error) {
        console.error('获取事务列表失败:', error);
        throw error;
    }
}

// 获取事务详情
export async function getTransactionById(id: number) {
    const sql = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, u.username as username
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
    `;

    try {
        return await db.get(sql, [id]);
    } catch (error) {
        console.error('获取事务详情失败:', error);
        throw error;
    }
}

// 更新事务
export async function updateTransaction(id: number, data: {
    amount?: number;
    type?: 'income' | 'expense';
    category_id?: number;
    description?: string;
    date?: string;
}) {
    const updates = [];
    const values = [];

    if (data.amount !== undefined) {
        updates.push('amount = ?');
        values.push(data.amount);
    }
    if (data.type !== undefined) {
        updates.push('type = ?');
        values.push(data.type);
    }
    if (data.category_id !== undefined) {
        updates.push('category_id = ?');
        values.push(data.category_id);
    }
    if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
    }
    if (data.date !== undefined) {
        updates.push('date = ?');
        values.push(data.date);
    }

    if (updates.length === 0) return null;

    const sql = `
        UPDATE transactions
        SET ${updates.join(', ')}
        WHERE id = ?
    `;
    values.push(id);

    try {
        await db.run(sql, values);
        return { id, ...data };
    } catch (error) {
        console.error('更新事务失败:', error);
        throw error;
    }
}

// 删除事务
export async function deleteTransaction(id: number) {
    const sql = 'DELETE FROM transactions WHERE id = ?';

    try {
        await db.run(sql, [id]);
        return true;
    } catch (error) {
        console.error('删除事务失败:', error);
        throw error;
    }
}

// 获取分类统计
export async function getCategoryStats(params: {
    family_id: number;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
}) {
    let conditions = ['t.family_id = ?'];
    const values = [params.family_id];

    if (params.startDate) {
        conditions.push('t.date >= ?');
        values.push(params.startDate);
    }
    if (params.endDate) {
        conditions.push('t.date <= ?');
        values.push(params.endDate);
    }
    if (params.type) {
        conditions.push('t.type = ?');
        values.push(params.type);
    }

    const sql = `
        SELECT 
            c.id as category_id,
            c.name as category_name,
            c.icon as category_icon,
            t.type,
            COUNT(*) as transaction_count,
            SUM(t.amount) as total_amount
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE ${conditions.join(' AND ')}
        GROUP BY c.id, t.type
        ORDER BY total_amount DESC
    `;

    try {
        return await db.all(sql, values);
    } catch (error) {
        console.error('获取分类统计失败:', error);
        throw error;
    }
} 