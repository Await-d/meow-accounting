import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class DB {
    private static instance: DB;
    private db: Database | null = null;
    private isTransaction: boolean = false;

    private constructor() { }

    public static getInstance(): DB {
        if (!DB.instance) {
            DB.instance = new DB();
        }
        return DB.instance;
    }

    public async connect(): Promise<void> {
        if (!this.db) {
            this.db = await open({
                filename: process.env.DB_PATH || ':memory:',
                driver: sqlite3.Database
            });
            await this.db.run('PRAGMA foreign_keys = ON');
            await this.createTables();
        }
    }

    // 事务支持
    public async beginTransaction(): Promise<void> {
        if (!this.db) throw new DatabaseError('Database not connected');
        if (this.isTransaction) throw new DatabaseError('Transaction already started');

        await this.db.run('BEGIN TRANSACTION');
        this.isTransaction = true;
    }

    public async commit(): Promise<void> {
        if (!this.db) throw new DatabaseError('Database not connected');
        if (!this.isTransaction) throw new DatabaseError('No transaction to commit');

        await this.db.run('COMMIT');
        this.isTransaction = false;
    }

    public async rollback(): Promise<void> {
        if (!this.db) throw new DatabaseError('Database not connected');
        if (!this.isTransaction) throw new DatabaseError('No transaction to rollback');

        await this.db.run('ROLLBACK');
        this.isTransaction = false;
    }

    // 通用CRUD操作
    public async findOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
        if (!this.db) await this.connect();
        try {
            const result = await this.db!.get(sql, params);
            return result as T || null;
        } catch (error) {
            throw new DatabaseError(`Query failed: ${(error as Error).message}`);
        }
    }

    public async getValue<T>(sql: string, params: any[] = []): Promise<T | null> {
        if (!this.db) throw new DatabaseError('Database not connected');
        try {
            const result = await this.db.get(sql, params);
            if (!result) return null;
            // 返回结果的第一个属性值
            const firstKey = Object.keys(result)[0];
            return result[firstKey] as T;
        } catch (error: any) {
            throw new DatabaseError(`Query failed: ${error.message}`);
        }
    }

    public async findMany<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) await this.connect();
        try {
            const result = await this.db!.all(sql, params);
            return result as T[];
        } catch (error) {
            throw new DatabaseError(`Query failed: ${(error as Error).message}`);
        }
    }

    public async execute(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) await this.connect();
        try {
            await this.db!.run(sql, params);
        } catch (error) {
            throw new DatabaseError(`Execute failed: ${(error as Error).message}`);
        }
    }

    public async insert(sql: string, params: any[] = []): Promise<number> {
        if (!this.db) await this.connect();
        try {
            const result = await this.db!.run(sql, params);
            return result.lastID ?? -1;
        } catch (error) {
            throw new DatabaseError(`Insert failed: ${(error as Error).message}`);
        }
    }

    private async createTables(): Promise<void> {
        // 为确保schema正确，先删除users表（开发环境）
        // 生产环境应使用迁移工具
        await this.db?.run('DROP TABLE IF EXISTS users');
        console.log('已删除旧的users表');
        
        // 创建users表（基础表，其他表依赖它）
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                display_name VARCHAR(100),
                avatar VARCHAR(255),
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 创建routes表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS routes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                permission VARCHAR(50) NOT NULL,
                user_id INTEGER,
                family_id INTEGER,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (family_id) REFERENCES families(id)
            )
        `);

        // 创建transactions表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount DECIMAL(15,2) NOT NULL,
                type VARCHAR(20) NOT NULL,
                category_id INTEGER,
                account_id INTEGER,
                description TEXT,
                transaction_date DATE NOT NULL,
                created_by INTEGER NOT NULL,
                updated_by INTEGER,
                family_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                FOREIGN KEY (account_id) REFERENCES accounts(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (updated_by) REFERENCES users(id),
                FOREIGN KEY (family_id) REFERENCES families(id)
            )
        `);

        // 确保transactions表包含account_id列（兼容旧表结构）
        const transactionColumns = await this.db?.all<{ name: string }[]>(
            'PRAGMA table_info(transactions)'
        );
        if (transactionColumns && !transactionColumns.some(column => column.name === 'account_id')) {
            await this.db?.run('ALTER TABLE transactions ADD COLUMN account_id INTEGER');
        }

        // 创建families表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS families (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                owner_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )
        `);

        // 创建family_members表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS family_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                family_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role VARCHAR(20) NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(family_id, user_id)
            )
        `);

        // 创建categories表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) NOT NULL,
                type VARCHAR(20) NOT NULL,
                icon VARCHAR(50),
                color VARCHAR(20),
                is_default BOOLEAN DEFAULT 0,
                family_id INTEGER,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);

        // 创建accounts表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                initial_balance DECIMAL(15,2) DEFAULT 0,
                currency VARCHAR(10) DEFAULT 'CNY',
                description TEXT,
                family_id INTEGER,
                user_id INTEGER,
                created_by INTEGER NOT NULL,
                updated_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (updated_by) REFERENCES users(id)
            )
        `);

        // 创建family_settings表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS family_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                family_id INTEGER NOT NULL,
                guest_password VARCHAR(100),
                default_currency VARCHAR(10) DEFAULT 'CNY',
                settings JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP,
                FOREIGN KEY (family_id) REFERENCES families(id)
            )
        `);

        // 创建route_stats表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS route_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER NOT NULL,
                access_count INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                total_load_time INTEGER DEFAULT 0,
                average_load_time FLOAT DEFAULT 0,
                last_accessed TIMESTAMP,
                cache_hits INTEGER DEFAULT 0,
                cache_misses INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id)
            )
        `);

        // 创建route_errors表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS route_errors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER NOT NULL,
                error_message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id)
            )
        `);

        // 创建route_params表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS route_params (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                params JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 创建route_params_history表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS route_params_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                params JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 创建user_settings表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                theme VARCHAR(20) DEFAULT 'system',
                language VARCHAR(10) DEFAULT 'zh-CN',
                appearance JSON,
                performance JSON,
                notifications JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 创建user_privacy_settings表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS user_privacy_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                visibility VARCHAR(20) DEFAULT 'private',
                show_transactions BOOLEAN DEFAULT 0,
                show_statistics BOOLEAN DEFAULT 0,
                guest_password VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE(user_id)
            )
        `);

        // 创建user_settings_history表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS user_settings_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                settings JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 创建路由访问历史表（用于预测）
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS route_access_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                previous_route_id INTEGER,
                session_id TEXT NOT NULL,
                load_time REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (previous_route_id) REFERENCES routes(id) ON DELETE SET NULL
            )
        `);

        // 创建路由访问历史索引
        await this.db?.run(`
            CREATE INDEX IF NOT EXISTS idx_route_access_user_route
            ON route_access_history(user_id, route_id, accessed_at)
        `);

        await this.db?.run(`
            CREATE INDEX IF NOT EXISTS idx_route_access_session
            ON route_access_history(session_id, accessed_at)
        `);

        await this.db?.run(`
            CREATE INDEX IF NOT EXISTS idx_route_access_transition
            ON route_access_history(user_id, previous_route_id, route_id)
        `);

        // 创建路由优化建议表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS route_optimization_suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_id INTEGER NOT NULL,
                suggestion_type TEXT NOT NULL,
                priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
                category TEXT NOT NULL CHECK(category IN ('performance', 'caching', 'error', 'other')),
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                impact TEXT NOT NULL,
                implemented BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
            )
        `);

        // 创建备份记录表
        await this.db?.run(`
            CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                size_bytes INTEGER NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL DEFAULT 'created',
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                restored_at TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);

        // 创建优化建议索引
        await this.db?.run(`
            CREATE INDEX IF NOT EXISTS idx_optimization_route
            ON route_optimization_suggestions(route_id, implemented)
        `);
    }

    // 调试：打印users表schema
    public async debugUsersSchema(): Promise<void> {
        if (!this.db) await this.connect();
        try {
            const schema = await this.db!.all('PRAGMA table_info(users)');
            console.log('=== Users表Schema ===');
            console.log(JSON.stringify(schema, null, 2));
            console.log('====================');
        } catch (error) {
            console.error('获取users表schema失败:', error);
        }
    }

    public async close(): Promise<void> {
        if (this.db) {
            if (this.isTransaction) {
                await this.rollback();
            }
            await this.db.close();
            this.db = null;
        }
    }
}

// 导出单例实例
export const db = DB.getInstance(); 
