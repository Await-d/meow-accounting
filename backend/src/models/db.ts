import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

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
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 创建交易记录表
        db.run(`
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

        // 插入默认分类数据
        const defaultCategories = [
            { name: '工资', type: 'income', icon: '💰' },
            { name: '兼职', type: 'income', icon: '💼' },
            { name: '理财', type: 'income', icon: '📈' },
            { name: '其他收入', type: 'income', icon: '🎁' },
            { name: '餐饮', type: 'expense', icon: '🍚' },
            { name: '交通', type: 'expense', icon: '🚌' },
            { name: '购物', type: 'expense', icon: '🛒' },
            { name: '居住', type: 'expense', icon: '🏠' },
            { name: '娱乐', type: 'expense', icon: '🎮' },
            { name: '医疗', type: 'expense', icon: '💊' },
            { name: '教育', type: 'expense', icon: '📚' },
            { name: '其他支出', type: 'expense', icon: '📝' }
        ];

        db.get('SELECT COUNT(*) as count FROM categories', (err, row: any) => {
            if (err) {
                console.error('检查分类数据时出错:', err);
                return;
            }

            if (row.count === 0) {
                const stmt = db.prepare('INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)');
                defaultCategories.forEach(category => {
                    stmt.run(category.name, category.type, category.icon);
                });
                stmt.finalize();
                console.log('默认分类数据已插入');
            }
        });
    });
}

// 导出数据库实例
export default db; 