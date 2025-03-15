/*
 * @Author: Await
 * @Date: 2025-03-15 16:40:25
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 16:32:23
 * @Description: 账户模型
 */
import { db } from '../database';

// 接口定义
interface AccountData {
    id?: number;
    name: string;
    type: string;
    initial_balance: number;
    currency: string;
    description?: string;
    family_id?: number;
    user_id?: number;
    created_by: number;
    updated_by?: number;
    created_at?: string;
    updated_at?: string;
}

interface AccountUpdateData {
    name?: string;
    type?: string;
    initial_balance?: number;
    currency?: string;
    description?: string;
    updated_by: number;
}

// 判断用户是否在家庭内
export const isUserInFamily = async (userId: number, familyId: number): Promise<boolean> => {
    const query = `
    SELECT COUNT(*) as count 
    FROM family_members 
    WHERE user_id = ? AND family_id = ?
  `;

    const result = await db.findOne<{ count: number }>(query, [userId, familyId]);
    return result ? result.count > 0 : false;
};

// 创建账户
export const createAccount = async (accountData: AccountData): Promise<AccountData> => {
    try {
        const { name, type, initial_balance, currency, description, family_id, user_id, created_by } = accountData;
        const created_at = new Date().toISOString();

        // 确保至少有family_id或user_id其中之一
        if (!family_id && !user_id) {
            throw new Error('账户必须关联到家庭或用户');
        }

        const query = `
      INSERT INTO accounts 
      (name, type, initial_balance, currency, description, family_id, user_id, created_by, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const id = await db.insert(query, [
            name,
            type,
            initial_balance,
            currency,
            description || '',
            family_id || null,
            user_id || null,
            created_by,
            created_at
        ]);

        return {
            id,
            name,
            type,
            initial_balance,
            currency,
            description: description || '',
            family_id,
            user_id,
            created_by,
            created_at
        };
    } catch (error) {
        console.error('创建账户失败:', error);
        throw error;
    }
};

// 获取单个账户
export const getAccountById = async (id: number): Promise<AccountData | null> => {
    try {
        const query = `
      SELECT * FROM accounts WHERE id = ?
    `;

        const account = await db.findOne<AccountData>(query, [id]);
        return account || null;
    } catch (error) {
        console.error('获取账户详情失败:', error);
        throw error;
    }
};

// 获取家庭账户列表
export const getAccountsByFamilyId = async (familyId: number): Promise<AccountData[]> => {
    try {
        const query = `
      SELECT a.*, u1.username as creator_name, u2.username as updater_name,
        (SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'expense') as total_expense,
        (SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'income') as total_income,
        (a.initial_balance + 
         COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'income'), 0) - 
         COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'expense'), 0)
        ) as current_balance
      FROM accounts a
      LEFT JOIN users u1 ON a.created_by = u1.id
      LEFT JOIN users u2 ON a.updated_by = u2.id
      WHERE a.family_id = ?
      ORDER BY a.created_at ASC
    `;

        const accounts = await db.findMany<AccountData>(query, [familyId]);
        return accounts;
    } catch (error) {
        console.error('获取家庭账户列表失败:', error);
        throw error;
    }
};

// 更新账户
export const updateAccount = async (id: number, data: AccountUpdateData): Promise<boolean> => {
    try {
        const { name, type, initial_balance, currency, description, updated_by } = data;
        const updated_at = new Date().toISOString();

        // 构建更新语句
        let updateFields = [];
        let params = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            params.push(name);
        }

        if (type !== undefined) {
            updateFields.push('type = ?');
            params.push(type);
        }

        if (initial_balance !== undefined) {
            updateFields.push('initial_balance = ?');
            params.push(initial_balance);
        }

        if (currency !== undefined) {
            updateFields.push('currency = ?');
            params.push(currency);
        }

        if (description !== undefined) {
            updateFields.push('description = ?');
            params.push(description);
        }

        // 添加更新时间和更新者
        updateFields.push('updated_at = ?');
        params.push(updated_at);
        updateFields.push('updated_by = ?');
        params.push(updated_by);

        // 添加ID
        params.push(id);

        const query = `
      UPDATE accounts
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

        await db.execute(query, params);
        return true;
    } catch (error) {
        console.error('更新账户失败:', error);
        throw error;
    }
};

// 删除账户
export const deleteAccount = async (id: number): Promise<boolean> => {
    try {
        const query = `DELETE FROM accounts WHERE id = ?`;
        await db.execute(query, [id]);
        return true;
    } catch (error) {
        console.error('删除账户失败:', error);
        throw error;
    }
};

// 检查账户是否有关联的交易记录
export const hasTransactions = async (accountId: number): Promise<boolean> => {
    try {
        const query = 'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?';
        const result = await db.findOne<{ count: number }>(query, [accountId]);
        return result ? result.count > 0 : false;
    } catch (error) {
        console.error('检查账户交易记录失败:', error);
        throw error;
    }
};

// 通过用户ID获取账户列表
export const getAccountsByUserId = async (userId: number): Promise<AccountData[]> => {
    try {
        // 查询同时包含个人账户和用户所在家庭的账户
        const query = `
            SELECT a.*, u1.username as creator_name, u2.username as updater_name,
              (SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'expense') as total_expense,
              (SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'income') as total_income,
              (a.initial_balance + 
               COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'income'), 0) - 
               COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.account_id = a.id AND t.type = 'expense'), 0)
              ) as current_balance
            FROM accounts a
            LEFT JOIN users u1 ON a.created_by = u1.id
            LEFT JOIN users u2 ON a.updated_by = u2.id
            WHERE a.user_id = ? 
            OR a.family_id IN (
                SELECT family_id FROM family_members WHERE user_id = ?
            )
            ORDER BY a.created_at DESC
        `;

        const accounts = await db.findMany<AccountData>(query, [userId, userId]);

        // 如果没有账户，返回空数组而不是抛出错误
        return accounts || [];
    } catch (error) {
        console.error('通过用户ID获取账户列表失败:', error);
        // 返回空数组而不是抛出错误，让控制器决定如何处理
        return [];
    }
};

// 判断账户是否存在
export const accountExists = async (accountId: number): Promise<boolean> => {
    const query = 'SELECT COUNT(*) as count FROM accounts WHERE id = ?';
    const result = await db.findOne<{ count: number }>(query, [accountId]);
    return result ? result.count > 0 : false;
}; 