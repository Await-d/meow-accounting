/*
 * @Author: Await
 * @Date: 2025-03-04 18:46:38
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 10:35:44
 * @Description: 请填写简介
 */
import sqlite3 from 'sqlite3';
import {Database} from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import * as routeModel from './route';

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

// 创建数据库连接
export const db = new sqlite3.Database(absoluteDbPath, (err) => {
    if (err) {
        console.error('数据库连接失败:', err);
    } else {
        console.log('数据库连接成功');
        initDatabase();
    }
});

// 初始化数据库表
function initDatabase() {
    db.serialize(() => {
        // 创建分类表
        db.run(`
            CREATE TABLE IF NOT EXISTS categories
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                name
                TEXT
                NOT
                NULL,
                type
                TEXT
                NOT
                NULL,
                icon
                TEXT,
                created_at
                DATETIME
                DEFAULT
                CURRENT_TIMESTAMP
            )
        `);

        // 创建交易记录表
        db.run(`
            CREATE TABLE IF NOT EXISTS transactions
            (
                id
                INTEGER
                PRIMARY
                KEY
                AUTOINCREMENT,
                amount
                DECIMAL
            (
                10,
                2
            ) NOT NULL,
                type TEXT NOT NULL,
                category_id INTEGER,
                description TEXT,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY
            (
                category_id
            ) REFERENCES categories
            (
                id
            )
                )
        `);

        // 初始化路由表
        routeModel.initRouteTable()
            .then(() => console.log('路由表初始化成功'))
            .catch(err => console.error('路由表初始化失败:', err));
    });
}

// 导出数据库实例
export default db;
