/*
 * @Author: Await
 * @Date: 2025-03-04 18:46:38
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:13:24
 * @Description: 请填写简介
 */
import path from 'path';
import dotenv from 'dotenv';
import * as routeModel from './route';
import { db } from '../config/database';

dotenv.config();

// 扩展sqlite3.Database类型，添加自定义方法的类型定义
declare module 'sqlite3' {
    interface Database {
        get<T = any>(sql: string, params?: any[] | any, callback?: (err: Error | null, row: T) => void): Promise<T>;

        all<T = any>(sql: string, params?: any[] | any, callback?: (err: Error | null, rows: T[]) => void): Promise<T[]>;

        run(sql: string, params?: any[] | any, callback?: (err: Error | null) => void): Promise<{ lastID: number, changes: number }>;
    }
}

const dbPath = process.env.DB_PATH || './database/bill.db';

// 确保使用绝对路径
const absoluteDbPath = path.resolve(dbPath);

// 初始化数据库
async function initDatabase() {
    try {
        // 确保数据库已连接
        await db.connect();

        // 创建分类表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                icon TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建交易记录表
        await db.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount DECIMAL(10,2) NOT NULL,
                type TEXT NOT NULL,
                category_id INTEGER,
                description TEXT,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        `);

        // 初始化路由表
        await routeModel.initRouteTable();
        console.log('路由表初始化成功');
    } catch (err) {
        console.error('数据库表初始化失败:', err);
    }
}

// 执行初始化
initDatabase().catch(err => {
    console.error('数据库初始化失败:', err);
});

// 导出数据库实例
export default db;
