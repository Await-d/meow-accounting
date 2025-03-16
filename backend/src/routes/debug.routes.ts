import express from 'express';
import { db } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// 获取交易记录的统计信息（仅管理员）
router.get('/transactions-stats', authenticate, async (req, res) => {
    try {
        // 检查用户权限
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权访问此接口' });
        }

        // 获取所有交易记录统计
        const totalQuery = 'SELECT COUNT(*) as total FROM transactions';
        const total = await db.findOne<{ total: number }>(totalQuery, []);

        // 获取有family_id的交易记录数
        const withFamilyQuery = 'SELECT COUNT(*) as count FROM transactions WHERE family_id IS NOT NULL';
        const withFamily = await db.findOne<{ count: number }>(withFamilyQuery, []);

        // 获取无family_id的交易记录数
        const withoutFamilyQuery = 'SELECT COUNT(*) as count FROM transactions WHERE family_id IS NULL';
        const withoutFamily = await db.findOne<{ count: number }>(withoutFamilyQuery, []);

        // 按用户分组统计无family_id的交易记录
        const byUserQuery = `
            SELECT created_by, COUNT(*) as count 
            FROM transactions 
            WHERE family_id IS NULL 
            GROUP BY created_by
        `;
        const byUser = await db.findMany(byUserQuery, []);

        res.json({
            total: total?.total || 0,
            withFamily: withFamily?.count || 0,
            withoutFamily: withoutFamily?.count || 0,
            byUser
        });
    } catch (error) {
        console.error('获取交易记录统计失败:', error);
        res.status(500).json({ error: '获取交易记录统计失败' });
    }
});

// 修复无家庭的交易记录
router.post('/fix-transactions', authenticate, async (req, res) => {
    try {
        // 检查用户权限
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: '无权访问此接口' });
        }

        // 查找所有没有family_id的交易记录
        const query = `
            SELECT t.id, t.created_by, u.currentFamilyId
            FROM transactions t
            JOIN users u ON t.created_by = u.id
            WHERE t.family_id IS NULL
        `;

        const transactions = await db.findMany(query, []);

        // 开始事务
        await db.beginTransaction();

        try {
            // 按用户分组更新交易
            let updatedCount = 0;
            let skippedCount = 0;

            for (const tx of transactions) {
                if (tx.currentFamilyId) {
                    // 更新交易记录，设置family_id为用户的当前家庭
                    const updateQuery = `
                        UPDATE transactions 
                        SET family_id = ? 
                        WHERE id = ?
                    `;

                    await db.execute(updateQuery, [tx.currentFamilyId, tx.id]);
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            }

            // 提交事务
            await db.commit();

            res.json({
                success: true,
                total: transactions.length,
                updated: updatedCount,
                skipped: skippedCount
            });
        } catch (error) {
            // 回滚事务
            await db.rollback();
            console.error('修复交易记录失败:', error);
            res.status(500).json({ error: '修复交易记录失败' });
        }
    } catch (error) {
        console.error('修复交易记录失败:', error);
        res.status(500).json({ error: '修复交易记录失败' });
    }
});

// 获取所有交易记录（仅调试用）
router.get('/all-transactions', authenticate, async (req, res) => {
    try {
        // 检查用户权限（可以放开，让所有用户都能访问）
        if (!req.user) {
            return res.status(401).json({ error: '未认证，请先登录' });
        }

        // 直接查询所有交易记录
        const allTransactionsQuery = `
            SELECT t.*, c.name as category_name, c.icon as category_icon, u.username
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN users u ON t.created_by = u.id
            ORDER BY t.transaction_date DESC
            LIMIT 100
        `;

        const transactions = await db.findMany(allTransactionsQuery, []);

        res.json({
            count: transactions.length,
            transactions
        });
    } catch (error) {
        console.error('获取所有交易记录失败:', error);
        res.status(500).json({ error: '获取所有交易记录失败' });
    }
});

export default router; 