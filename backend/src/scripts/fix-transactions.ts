/**
 * 修复数据库中的交易记录
 * 此脚本查找所有created_by非空但family_id为空的交易记录，
 * 并根据用户的当前家庭设置对应的family_id
 */
import { db } from '../config/database';

async function fixTransactions() {
    try {
        console.log('开始修复交易记录...');

        // 连接数据库
        await db.connect();

        // 查找所有没有family_id的交易记录
        const query = `
            SELECT t.id, t.created_by, u.currentFamilyId
            FROM transactions t
            JOIN users u ON t.created_by = u.id
            WHERE t.family_id IS NULL
        `;

        const transactions = await db.findMany(query, []);
        console.log(`找到 ${transactions.length} 条需要修复的交易记录`);

        // 开始事务
        await db.beginTransaction();

        try {
            // 按用户分组更新交易
            for (const tx of transactions) {
                if (tx.currentFamilyId) {
                    // 更新交易记录，设置family_id为用户的当前家庭
                    const updateQuery = `
                        UPDATE transactions 
                        SET family_id = ? 
                        WHERE id = ?
                    `;

                    await db.execute(updateQuery, [tx.currentFamilyId, tx.id]);
                    console.log(`已修复交易ID: ${tx.id}, 用户ID: ${tx.created_by}, 家庭ID: ${tx.currentFamilyId}`);
                } else {
                    console.log(`跳过交易ID: ${tx.id}, 用户ID: ${tx.created_by}，无当前家庭`);
                }
            }

            // 提交事务
            await db.commit();
            console.log('修复完成，已成功提交更改');
        } catch (error) {
            // 回滚事务
            await db.rollback();
            console.error('修复失败，已回滚更改:', error);
        }

    } catch (error) {
        console.error('执行脚本时出错:', error);
    } finally {
        console.log('关闭数据库连接');
        await db.close();
    }
}

// 执行脚本
fixTransactions().catch(console.error); 