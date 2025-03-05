/*
 * @Author: Await
 * @Date: 2025-03-05 19:24:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:25:13
 * @Description: 请填写简介
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import { createUserTable } from './models/user';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 路由
app.use('/api/auth', authRoutes);

// 初始化数据库表
async function initDatabase() {
    try {
        await createUserTable();
        console.log('数据库表初始化成功');
    } catch (error) {
        console.error('数据库表初始化失败:', error);
        process.exit(1);
    }
}

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    await initDatabase();
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

export default app; 