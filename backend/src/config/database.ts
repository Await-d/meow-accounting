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
    public async findOne<T>(sql: string, params: any[] = []): Promise<T | null> {
        if (!this.db) throw new DatabaseError('Database not connected');
        try {
            const result = await this.db.get(sql, params);
            return result as T || null;
        } catch (error: any) {
            throw new DatabaseError(`Query failed: ${error.message}`);
        }
    }

    public async findMany<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) throw new DatabaseError('Database not connected');
        try {
            const results = await this.db.all(sql, params);
            return results as T[];
        } catch (error: any) {
            throw new DatabaseError(`Query failed: ${error.message}`);
        }
    }

    public async execute(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) throw new DatabaseError('Database not connected');
        try {
            await this.db.run(sql, params);
        } catch (error: any) {
            throw new DatabaseError(`Execute failed: ${error.message}`);
        }
    }

    public async insert(sql: string, params: any[] = []): Promise<number> {
        if (!this.db) throw new DatabaseError('Database not connected');
        try {
            const result = await this.db.run(sql, params);
            return result?.lastID ?? -1; // 如果插入失败返回-1
        } catch (error: any) {
            throw new DatabaseError(`Insert failed: ${error.message}`);
        }
    }

    private async createTables(): Promise<void> {
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