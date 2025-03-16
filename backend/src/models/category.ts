/*
 * @Author: Await
 * @Date: 2025-03-15 17:15:45
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 16:40:25
 * @Description: 分类模型
 */
import { db } from '../config/database';

// 分类接口定义
export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
    is_default: boolean;
    family_id?: number;
    created_by?: number;
    updated_by?: number;
    created_at: string;
    updated_at?: string;
}

// 创建分类参数接口
export interface CreateCategoryParams {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
    is_default?: boolean;
    family_id?: number;
    created_by?: number;
}

// 更新分类参数接口
export interface UpdateCategoryParams {
    name?: string;
    icon?: string;
    color?: string;
}

// 检查用户是否属于家庭
export const isUserInFamily = async (userId: number, familyId: number): Promise<boolean> => {
    try {
        const query = `
            SELECT COUNT(*) as count 
            FROM family_members 
            WHERE user_id = ? AND family_id = ?
        `;

        const result = await db.findOne<{ count: number }>(query, [userId, familyId]);
        return result ? result.count > 0 : false;
    } catch (error) {
        console.error('检查用户是否属于家庭失败:', error);
        throw error;
    }
};

// 获取默认分类
export const getDefaultCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
    try {
        let query = 'SELECT * FROM categories WHERE is_default = 1';
        const params: any[] = [];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY name';

        const categories = await db.findMany<Category>(query, params);
        return categories;
    } catch (error) {
        console.error('获取默认分类失败:', error);
        throw error;
    }
};

// 获取家庭自定义分类
export const getCustomCategories = async (familyId: number, type?: 'income' | 'expense'): Promise<Category[]> => {
    try {
        let query = `
            SELECT c.*, u1.username as creator_name
            FROM categories c
            LEFT JOIN users u1 ON c.created_by = u1.id
            WHERE c.family_id = ? AND c.is_default = 0
        `;

        const params: any[] = [familyId];

        if (type) {
            query += ' AND c.type = ?';
            params.push(type);
        }

        query += ' ORDER BY c.name';

        const categories = await db.findMany<Category>(query, params);
        return categories;
    } catch (error) {
        console.error('获取家庭自定义分类失败:', error);
        throw error;
    }
};

// 获取分类详情
export const getCategoryById = async (id: number): Promise<Category | null> => {
    try {
        const query = `
            SELECT c.*, u1.username as creator_name
            FROM categories c
            LEFT JOIN users u1 ON c.created_by = u1.id
            WHERE c.id = ?
        `;

        const category = await db.findOne<Category>(query, [id]);
        return category || null;
    } catch (error) {
        console.error('获取分类详情失败:', error);
        throw error;
    }
};

// 创建分类
export const createCategory = async (params: CreateCategoryParams): Promise<Category> => {
    try {
        const { name, type, icon, color, is_default = false, family_id, created_by } = params;
        const created_at = new Date().toISOString();

        const query = `
            INSERT INTO categories (name, type, icon, color, is_default, family_id, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await db.insert(
            query,
            [name, type, icon, color, is_default ? 1 : 0, family_id, created_by || null, created_at]
        );

        return {
            id: result,
            name,
            type,
            icon,
            color,
            is_default: !!is_default,
            family_id,
            created_by,
            created_at
        };
    } catch (error) {
        console.error('创建分类失败:', error);
        throw error;
    }
};

// 更新分类
export const updateCategory = async (id: number, params: UpdateCategoryParams): Promise<Category> => {
    try {
        // 提取所有要更新的字段
        const { name, icon, color } = params; // 移除updated_by字段

        // 构建UPDATE语句
        const updateFields: string[] = [];
        const queryParams: any[] = [];

        if (name) {
            updateFields.push('name = ?');
            queryParams.push(name);
        }
        if (icon) {
            updateFields.push('icon = ?');
            queryParams.push(icon);
        }
        if (color) {
            updateFields.push('color = ?');
            queryParams.push(color);
        }

        // 添加更新时间
        updateFields.push('updated_at = ?');
        queryParams.push(new Date().toISOString());

        // 没有可更新的字段则直接返回
        if (updateFields.length === 0) {
            throw new Error('没有提供要更新的字段');
        }

        // 构建完整的UPDATE语句
        const updateQuery = `
            UPDATE categories
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `;

        // 添加ID参数
        queryParams.push(id);

        // 执行更新
        await db.execute(updateQuery, queryParams);

        // 获取更新后的分类
        const updatedCategory = await getCategoryById(id);
        if (!updatedCategory) {
            throw new Error('未找到更新后的分类');
        }

        return updatedCategory;
    } catch (error) {
        console.error('更新分类失败:', error);
        throw error;
    }
};

// 删除分类
export const deleteCategory = async (id: number): Promise<void> => {
    try {
        const query = 'DELETE FROM categories WHERE id = ?';
        await db.execute(query, [id]);
    } catch (error) {
        console.error('删除分类失败:', error);
        throw error;
    }
};

// 检查分类是否被使用
export const isCategoryInUse = async (categoryId: number): Promise<boolean> => {
    try {
        const query = 'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?';
        const result = await db.findOne<{ count: number }>(query, [categoryId]);
        return result ? result.count > 0 : false;
    } catch (error) {
        console.error('检查分类是否被使用失败:', error);
        throw error;
    }
};

// 检查分类是否属于指定家庭
export const isCategoryInFamily = async (categoryId: number, familyId: number): Promise<boolean> => {
    try {
        // 先检查是否为默认分类
        const defaultQuery = 'SELECT COUNT(*) as count FROM categories WHERE id = ? AND is_default = 1';
        const defaultResult = await db.findOne<{ count: number }>(defaultQuery, [categoryId]);

        // 如果是默认分类，允许任何家庭使用
        if (defaultResult && defaultResult.count > 0) {
            return true;
        }

        // 否则检查是否属于指定家庭
        const query = 'SELECT COUNT(*) as count FROM categories WHERE id = ? AND family_id = ?';
        const result = await db.findOne<{ count: number }>(query, [categoryId, familyId]);
        return result ? result.count > 0 : false;
    } catch (error) {
        console.error('检查分类是否属于家庭失败:', error);
        throw error;
    }
};

// 创建分类表
export async function createCategoryTable(): Promise<void> {
    console.log('使用database.ts中的表创建功能，此方法已弃用');
    // 不再创建表，避免表结构冲突
}

// 初始化默认分类数据
export async function initDefaultCategories(): Promise<void> {
    try {
        // 检查是否已经有默认分类
        const existingCategories = await getDefaultCategories();
        if (existingCategories.length > 0) {
            console.log('默认分类已存在，跳过初始化');
            return;
        }

        // 收入默认分类
        const incomeCategories = [
            { name: '工资', type: 'income', icon: 'money', color: '#4CAF50' },
            { name: '奖金', type: 'income', icon: 'gift', color: '#2196F3' },
            { name: '投资', type: 'income', icon: 'trending-up', color: '#9C27B0' },
            { name: '其他收入', type: 'income', icon: 'plus-circle', color: '#607D8B' }
        ];

        // 支出默认分类
        const expenseCategories = [
            { name: '餐饮', type: 'expense', icon: 'restaurant', color: '#F44336' },
            { name: '购物', type: 'expense', icon: 'shopping-cart', color: '#FF9800' },
            { name: '交通', type: 'expense', icon: 'car', color: '#3F51B5' },
            { name: '住房', type: 'expense', icon: 'home', color: '#795548' },
            { name: '娱乐', type: 'expense', icon: 'music', color: '#E91E63' },
            { name: '其他支出', type: 'expense', icon: 'minus-circle', color: '#9E9E9E' }
        ];

        const defaultCategories = [...incomeCategories, ...expenseCategories];

        // 尝试获取系统用户ID，但不再将其设为必须项
        let systemUserId: number | undefined;

        try {
            // 查询是否存在系统用户(ID为1的用户)
            const systemUserQuery = 'SELECT id FROM users WHERE id = 1 LIMIT 1';
            const systemUser = await db.findOne<{ id: number }>(systemUserQuery, []);

            if (systemUser) {
                systemUserId = systemUser.id;
                console.log(`使用用户ID ${systemUserId} 创建默认分类`);
            } else {
                // 如果没有系统用户，尝试查找第一个可用的用户
                const firstUserQuery = 'SELECT id FROM users ORDER BY id LIMIT 1';
                const firstUser = await db.findOne<{ id: number }>(firstUserQuery, []);

                if (firstUser) {
                    systemUserId = firstUser.id;
                    console.log(`使用用户ID ${systemUserId} 创建默认分类`);
                } else {
                    console.log('未找到有效用户，将创建无关联用户的默认分类');
                }
            }
        } catch (error) {
            console.log('查询用户失败，将创建无关联用户的默认分类');
        }

        // 批量插入默认分类
        for (const cat of defaultCategories) {
            await createCategory({
                name: cat.name,
                type: cat.type as 'income' | 'expense',
                icon: cat.icon,
                color: cat.color,
                is_default: true,
                family_id: undefined, // 默认分类不属于特定家庭
                created_by: systemUserId // 可能为undefined，由createCategory函数处理
            });
        }

        console.log('默认分类初始化成功');
    } catch (error) {
        console.error('初始化默认分类失败:', error);
        throw error;
    }
}