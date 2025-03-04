/*
 * @Author: Await
 * @Date: 2025-03-04 18:48:21
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 18:51:30
 * @Description: 请填写简介
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

// 加载环境变量
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', routes);

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 