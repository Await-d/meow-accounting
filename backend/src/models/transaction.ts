/*
 * @Author: Await
 * @Date: 2025-03-15 17:15:45
 * @LastEditors: Await
 * @LastEditTime: 2025-03-16 13:16:51
 * @Description: 交易记录模型
 */
import { db } from '../config/database';

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
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    try {
        await db.execute(sql);
        console.log('Transaction table created or already exists.');
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
    family_id?: number;
}) {
    const { amount, type, category_id, description = '', date, user_id, family_id } = data;

    // 构建插入SQL
    let sql = '';
    let values = [];

    if (family_id) {
        sql = `
            INSERT INTO transactions (amount, type, category_id, description, transaction_date, created_by, family_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        values = [amount, type, category_id, description, date, user_id, family_id];
    } else {
        sql = `
            INSERT INTO transactions (amount, type, category_id, description, transaction_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        values = [amount, type, category_id, description, date, user_id];
    }

    try {
        const id = await db.insert(sql, values);

        return {
            id,
            ...data
        };
    } catch (error) {
        console.error('创建事务失败:', error);
        throw error;
    }
}

// 获取家庭的事务列表
export async function getTransactions(params: {
    family_id?: number;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    category_id?: number;
    user_id?: number;
    page?: number;
    pageSize?: number;
}) {
    let conditions = [];
    const values: any[] = [];

    // 打印接收到的参数，帮助调试
    console.log("查询参数:", JSON.stringify(params));

    // 根据family_id或user_id过滤交易
    if (params.family_id) {
        // 查询特定家庭的交易
        conditions.push('t.family_id = ?');
        values.push(params.family_id);
    } else if (params.user_id) {
        // 查询个人交易时，明确排除家庭交易
        conditions.push('t.created_by = ?');
        values.push(params.user_id);
        // 个人模式时显式排除有家庭ID的交易记录
        conditions.push('(t.family_id IS NULL OR t.family_id = 0)');
    }

    if (params.startDate) {
        conditions.push('t.transaction_date >= ?');
        values.push(params.startDate);
    }
    if (params.endDate) {
        conditions.push('t.transaction_date <= ?');
        values.push(params.endDate);
    }
    if (params.type) {
        conditions.push('t.type = ?');
        values.push(params.type);
    }
    if (params.category_id) {
        conditions.push('t.category_id = ?');
        values.push(params.category_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
        SELECT t.*, c.name as category_name, c.icon as category_icon, u.username as username
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.created_by = u.id
        ${whereClause}
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT ? OFFSET ?
    `;

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    values.push(pageSize, (page - 1) * pageSize);

    try {
        const transactions = await db.findMany(sql, values);

        // 获取总数
        const countSql = `
            SELECT COUNT(*) as total
            FROM transactions t
            ${whereClause}
        `;
        const total = await db.findOne<{ total: number }>(countSql, values.slice(0, -2));

        return {
            data: transactions,
            total: total?.total ?? 0,
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
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = ?
    `;

    try {
        return await db.findOne(sql, [id]);
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
        updates.push('transaction_date = ?');
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
        await db.execute(sql, values);
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
        await db.execute(sql, [id]);
        return true;
    } catch (error) {
        console.error('删除事务失败:', error);
        throw error;
    }
}

// 获取分类统计
export async function getCategoryStats(params: {
    family_id?: number;
    startDate?: string;
    endDate?: string;
    type?: 'income' | 'expense';
    user_id?: number;
}) {
    let conditions = [];
    const values: any[] = [];

    // 打印接收到的参数，帮助调试
    console.log("分类统计查询参数:", JSON.stringify(params));

    // 根据家庭ID或用户ID过滤交易
    if (params.family_id) {
        conditions.push('t.family_id = ?');
        values.push(params.family_id);
    } else if (params.user_id) {
        // 只根据用户ID过滤，不限制family_id
        conditions.push('t.created_by = ?');
        values.push(params.user_id);
    }

    if (params.startDate) {
        conditions.push('t.transaction_date >= ?');
        values.push(params.startDate);
    }
    if (params.endDate) {
        conditions.push('t.transaction_date <= ?');
        values.push(params.endDate);
    }
    if (params.type) {
        conditions.push('t.type = ?');
        values.push(params.type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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
        ${whereClause}
        GROUP BY c.id, t.type
        ORDER BY total_amount DESC
    `;

    try {
        return await db.findMany(sql, values);
    } catch (error) {
        console.error('获取分类统计失败:', error);
        throw error;
    }
}

// 获取统计数据
export async function getStatistics({ familyId, startDate, endDate, userId }: {
    familyId?: number;
    startDate: string;
    endDate: string;
    userId?: number;
}) {
    // 构建查询条件
    const conditions = [];
    const params = [];

    // 打印接收到的参数，帮助调试
    console.log("统计查询参数:", { familyId, startDate, endDate, userId });

    // 根据家庭ID或用户ID过滤交易
    if (familyId) {
        conditions.push('family_id = ?');
        params.push(familyId);
    } else if (userId) {
        // 仅在未指定family_id时使用user_id过滤个人交易
        conditions.push('created_by = ?');
        params.push(userId);
        // 个人模式时明确排除家庭交易
        conditions.push('(family_id IS NULL OR family_id = 0)');
    }

    // 添加日期条件
    if (startDate && endDate) {
        conditions.push('transaction_date BETWEEN ? AND ?');
        params.push(startDate, endDate);
    }

    // 构建WHERE子句
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
        SELECT 
            type,
            COUNT(*) as count,
            SUM(amount) as total,
            AVG(amount) as average,
            MIN(amount) as min,
            MAX(amount) as max
        FROM transactions
        ${whereClause}
        GROUP BY type
    `;

    try {
        return await db.findMany(sql, params);
    } catch (error) {
        console.error('获取统计数据失败:', error);
        throw error;
    }
}

// 获取最近的交易记录
export async function getRecentTransactions({ userId, familyId, limit = 5 }: {
    userId?: number;
    familyId?: number;
    limit?: number;
}) {
    try {
        // 构建查询条件
        const conditions = [];
        const params = [];

        // 打印接收到的参数，帮助调试
        console.log("最近交易查询参数:", { userId, familyId, limit });

        // 根据家庭ID或用户ID过滤交易
        if (familyId) {
            conditions.push('t.family_id = ?');
            params.push(familyId);
        } else if (userId) {
            // 只根据用户ID过滤，不限制family_id
            conditions.push('t.created_by = ?');
            params.push(userId);
        }

        // 构建WHERE子句
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            SELECT t.id, t.amount, t.type, t.category_id, t.description, t.transaction_date as date, 
                   c.name as category_name, c.icon as category_icon
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            ${whereClause}
            ORDER BY t.transaction_date DESC, t.id DESC
            LIMIT ?
        `;

        params.push(limit);
        const transactions = await db.findMany(query, params);

        return transactions;
    } catch (error) {
        console.error('获取最近交易记录失败:', error);
        throw error;
    }
}

// 检查用户是否属于指定家庭
export async function isUserInFamily(userId: number, familyId: number): Promise<boolean> {
    try {
        console.log(`检查用户(${userId})是否属于家庭(${familyId})`);

        const query = `
            SELECT COUNT(*) as count 
            FROM family_members 
            WHERE user_id = ? AND family_id = ?
        `;

        const result = await db.findOne<{ count: number }>(query, [userId, familyId]);

        // 如果查询成功但没有记录，返回false
        if (!result) return false;

        return result.count > 0;
    } catch (error) {
        console.error('检查用户是否属于家庭时出错:', error);
        // 出错时默认返回false，确保安全
        return false;
    }
}

// 统计参数接口
export interface TransactionStatsParams {
    startDate: string;
    endDate: string;
    userId?: number;
    familyId?: number;
}

// 统计结果接口
export interface TransactionStats {
    totalIncome: number;
    totalExpense: number;
    chart: Array<{
        date: string;
        income: number;
        expense: number;
    }>;
}

// 查看表结构的工具函数
export async function getTableSchema(tableName: string) {
    try {
        const sql = `PRAGMA table_info(${tableName})`;
        const columns = await db.findMany(sql, []);
        return columns;
    } catch (error) {
        console.error(`获取表 ${tableName} 结构失败:`, error);
        throw error;
    }
}

// 获取交易统计数据
export async function getTransactionStats(params: TransactionStatsParams): Promise<TransactionStats> {
    const { startDate, endDate, userId, familyId } = params;

    // 构建查询条件
    const conditions = [];
    const queryParams = [];

    // 根据家庭ID或用户ID过滤交易
    if (familyId) {
        conditions.push('family_id = ?');
        queryParams.push(familyId);
    } else if (userId) {
        // 仅在未指定family_id时使用user_id过滤个人交易
        conditions.push('created_by = ?');
        queryParams.push(userId);
        // 个人模式时明确排除家庭交易
        conditions.push('(family_id IS NULL OR family_id = 0)');
    }

    // 日期条件
    if (startDate && endDate) {
        conditions.push('transaction_date BETWEEN ? AND ?');
        queryParams.push(startDate, endDate);
    }

    // 构建完整的WHERE子句
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 总收入和支出查询
    const totalQuery = `
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense
        FROM transactions
        ${whereClause}
    `;

    // 按日期分组的查询
    const chartQuery = `
        SELECT 
            transaction_date as date,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions
        ${whereClause}
        GROUP BY transaction_date
        ORDER BY transaction_date
    `;

    try {
        // 获取总收入和支出
        const totals = await db.findOne<{ totalIncome: number; totalExpense: number }>(totalQuery, queryParams);

        // 获取图表数据
        const chartData = await db.findMany<{ date: string; income: number; expense: number }>(chartQuery, queryParams);

        return {
            totalIncome: totals?.totalIncome || 0,
            totalExpense: totals?.totalExpense || 0,
            chart: chartData || []
        };
    } catch (error) {
        console.error('获取交易统计失败:', error);
        throw error;
    }
}

// 分类统计参数接口
export interface CategoryStatsParams {
    startDate: string;
    endDate: string;
    userId?: number;
    familyId?: number;
}

// 获取分类统计数据
export async function getTransactionCategoryStats(params: CategoryStatsParams): Promise<any[]> {
    try {
        const conditions = [];
        const queryParams = [];

        // 打印接收到的参数，帮助调试
        console.log("交易分类统计查询参数:", JSON.stringify(params));

        // 根据家庭ID或用户ID过滤交易
        if (params.familyId) {
            conditions.push('t.family_id = ?');
            queryParams.push(params.familyId);
        } else if (params.userId) {
            // 个人模式下，只显示个人交易，排除家庭交易
            conditions.push('t.created_by = ?');
            queryParams.push(params.userId);
            // 明确排除家庭交易
            conditions.push('(t.family_id IS NULL OR t.family_id = 0)');
        }

        // 添加日期范围条件
        if (params.startDate && params.endDate) {
            conditions.push('t.transaction_date BETWEEN ? AND ?');
            queryParams.push(params.startDate, params.endDate);
        }

        // 构建WHERE子句
        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // 定义分类结果类型
        interface CategoryResult {
            id: number;
            name: string;
            icon: string;
            color: string;
            total_amount: number;
            transaction_count: number;
        }

        // 查询收入分类统计
        const incomeQuery = `
            SELECT 
                c.id, 
                c.name, 
                c.icon,
                c.color,
                SUM(t.amount) as total_amount,
                COUNT(*) as transaction_count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            ${whereClause} AND t.type = 'income'
            GROUP BY c.id
            ORDER BY total_amount DESC
        `;

        // 查询支出分类统计
        const expenseQuery = `
            SELECT 
                c.id, 
                c.name, 
                c.icon,
                c.color,
                SUM(t.amount) as total_amount,
                COUNT(*) as transaction_count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            ${whereClause} AND t.type = 'expense'
            GROUP BY c.id
            ORDER BY total_amount DESC
        `;

        const incomeCategories = await db.findMany<CategoryResult>(incomeQuery, queryParams);
        const expenseCategories = await db.findMany<CategoryResult>(expenseQuery, queryParams);

        // 返回结果
        return [
            {
                type: 'income',
                categories: incomeCategories.map((category: CategoryResult) => ({
                    id: category.id,
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    amount: category.total_amount,
                    count: category.transaction_count
                }))
            },
            {
                type: 'expense',
                categories: expenseCategories.map((category: CategoryResult) => ({
                    id: category.id,
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    amount: category.total_amount,
                    count: category.transaction_count
                }))
            }
        ];
    } catch (error) {
        console.error('获取分类统计数据失败:', error);
        throw error;
    }
}
