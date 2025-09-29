/*
 * @Author: Claude Code
 * @Date: 2025-09-28
 * @Description: 数据库连接测试
 */
import { DB, db } from '../config/database';

describe('数据库连接测试', () => {
    afterAll(async () => {
        await db.close();
    });

    it('应该能够连接到数据库', async () => {
        await expect(db.connect()).resolves.not.toThrow();
    });

    it('应该能够执行简单查询', async () => {
        await db.connect();

        const result = await db.getValue<number>('SELECT 1 as test');
        expect(result).toBe(1);
    });

    it('应该能够创建临时表', async () => {
        await db.connect();

        await expect(
            db.execute('CREATE TEMPORARY TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)')
        ).resolves.not.toThrow();
    });

    it('应该能够插入和查询数据', async () => {
        await db.connect();

        // 创建临时表
        await db.execute('CREATE TEMPORARY TABLE test_users (id INTEGER PRIMARY KEY, name TEXT)');

        // 插入数据
        const insertId = await db.insert('INSERT INTO test_users (name) VALUES (?)', ['testuser']);
        expect(insertId).toBeGreaterThan(0);

        // 查询数据
        const user = await db.findOne<{id: number, name: string}>('SELECT * FROM test_users WHERE id = ?', [insertId]);
        expect(user).not.toBeNull();
        expect(user?.name).toBe('testuser');
    });

    it('应该能够处理事务', async () => {
        await db.connect();

        // 创建临时表
        await db.execute('CREATE TEMPORARY TABLE test_transactions (id INTEGER PRIMARY KEY, value INTEGER)');

        // 开始事务
        await db.beginTransaction();

        try {
            await db.insert('INSERT INTO test_transactions (value) VALUES (?)', [100]);
            await db.insert('INSERT INTO test_transactions (value) VALUES (?)', [200]);

            await db.commit();

            const count = await db.getValue<number>('SELECT COUNT(*) as count FROM test_transactions');
            expect(count).toBe(2);
        } catch (error) {
            await db.rollback();
            throw error;
        }
    });
});