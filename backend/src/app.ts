/*
 * @Author: Await
 * @Date: 2025-03-05 19:24:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 12:33:00
 * @Description: 请填写简介
 */
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
import categoriesRoutes from './routes/categories';
import transactionRoutes from './routes/transaction.routes';
import cacheRoutes from './routes/cache';
import { createUserTable } from './models/user';
import { createFamilyTables } from './models/family';
import { createCategoryTable } from './models/category';
import { createTransactionTable } from './models/transaction';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 添加请求体日志中间件
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log(`${req.method} ${req.url} 请求体:`, req.body);
    }
    next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cache', cacheRoutes);

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

// initDatabase();

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;
