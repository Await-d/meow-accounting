/*
 * @Author: Await
 * @Date: 2025-03-05 19:24:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:41:21
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
import routeRoutes from './routes/route.routes';
import { createUserTable } from './models/user';
import { createFamilyTables } from './models/family';
import { createCategoryTable } from './models/category';
import { createTransactionTable } from './models/transaction';
import { db } from './config/database';
import { swaggerUi, specs } from './swagger';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// Swagger文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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
app.use('/api/routes', routeRoutes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库表
async function initDatabase() {
    try {
        // 确保数据库已连接
        await db.connect();
        console.log('数据库连接成功');

        // 初始化表
        await createUserTable();
        await createFamilyTables();
        await createCategoryTable();
        await createTransactionTable();
        console.log('数据库表初始化成功');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
}

// 启动服务器
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`API文档访问地址: http://localhost:${PORT}/api-docs`);
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app;
