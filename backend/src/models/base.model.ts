/*
 * @Author: Await
 * @Date: 2025-03-12 20:12:19
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 20:27:36
 * @Description: 请填写简介
 */
import { db, DatabaseError } from '../config/database';

export abstract class BaseModel<T> {
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected async findById(id: number): Promise<T | null> {
        return db.findOne<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    }

    protected async findOne(conditions: Record<string, any>): Promise<T | null> {
        const keys = Object.keys(conditions);
        const where = keys.map(key => `${key} = ?`).join(' AND ');
        const values = Object.values(conditions);

        return db.findOne<T>(
            `SELECT * FROM ${this.tableName} WHERE ${where}`,
            values
        );
    }

    protected async findMany(conditions: Record<string, any> = {}): Promise<T[]> {
        const keys = Object.keys(conditions);
        let sql = `SELECT * FROM ${this.tableName}`;
        const values: any[] = [];

        if (keys.length > 0) {
            const where = keys.map(key => `${key} = ?`).join(' AND ');
            sql += ` WHERE ${where}`;
            values.push(...Object.values(conditions));
        }

        return db.findMany<T>(sql, values);
    }

    protected async create(data: Record<string, any>): Promise<number> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = new Array(keys.length).fill('?').join(', ');

        return db.insert(
            `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
            values
        );
    }

    protected async update(id: number, data: Record<string, any>): Promise<void> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const sets = keys.map(key => `${key} = ?`).join(', ');

        await db.execute(
            `UPDATE ${this.tableName} SET ${sets} WHERE id = ?`,
            [...values, id]
        );
    }

    protected async delete(id: number): Promise<void> {
        await db.execute(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
    }

    protected async execute<T>(sql: string, params: any[] = []): Promise<T> {
        const result = await db.findMany<T>(sql, params);
        return Array.isArray(result) ? result[0] : result;
    }

    protected async transaction<T>(callback: () => Promise<T>): Promise<T> {
        try {
            await db.beginTransaction();
            const result = await callback();
            await db.commit();
            return result;
        } catch (error) {
            await db.rollback();
            throw error;
        }
    }
} 