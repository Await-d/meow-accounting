/*
 * @Author: Await
 * @Date: 2025-03-05 19:24:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 21:25:02
 * @Description: 请填写简介
 */
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import familyRoutes from './routes/family.routes';
import userRoutes from './routes/user.routes';
import categoryRoutes from './routes/category.routes';
import transactionRoutes from './routes/transaction.routes';
import { createUserTable } from './models/user';
import { createFamilyTables } from './models/family';
import { createCategoryTable } from './models/category';
import { createTransactionTable } from './models/transaction';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);

// 初始化数据库表
async function initDatabase() {
    try {
        await createUserTable();
        await createFamilyTables();
        await createCategoryTable();
        await createTransactionTable();
        console.log('数据库表初始化成功');
    } catch (error) {
        console.error('数据库表初始化失败:', error);
        process.exit(1);
    }
}

initDatabase();

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app; 