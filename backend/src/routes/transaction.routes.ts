/*
 * @Author: Await
 * @Date: 2025-03-05 20:47:58
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 14:52:00
 * @Description: 请填写简介
 */
import express from 'express';
import multer from 'multer';
import * as transactionController from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth';
import { familyMemberMiddleware } from '../middleware/family';
import { authenticate } from '../middleware/auth.middleware';
import {
    createTransaction,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions,
    getRecentTransactions,
    importTransactions,
    exportTransactions
} from '../controllers/transaction.controller';

const router = express.Router();

// 配置文件上传
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制5MB
    },
    fileFilter: (req, file, cb) => {
        // 只接受CSV文件
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('只允许上传CSV文件!'));
        }
    }
});

// 所有路由都需要认证
router.use(authMiddleware);

// 统计相关路由
router.get('/stats', familyMemberMiddleware, transactionController.getStatistics);
router.get('/stats/category', familyMemberMiddleware, transactionController.getCategoryStats);
router.get('/recent', familyMemberMiddleware, transactionController.getRecentTransactions);

// 事务相关路由
router.post('/', familyMemberMiddleware, transactionController.createTransaction);
router.get('/', familyMemberMiddleware, transactionController.getTransactions);
router.get('/:id', familyMemberMiddleware, transactionController.getTransactionById);
router.put('/:id', familyMemberMiddleware, transactionController.updateTransaction);
router.delete('/:id', familyMemberMiddleware, transactionController.deleteTransaction);

/**
 * @swagger
 * /api/transactions/recent:
 *   get:
 *     summary: 获取最近的交易记录
 *     tags: [交易]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: 返回记录数量限制
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: number
 *         description: 用户ID (可选)
 *       - in: query
 *         name: family_id
 *         schema:
 *           type: number
 *         description: 家庭ID (可选)
 *     responses:
 *       200:
 *         description: 成功返回最近的交易记录
 */
router.get('/transactions/recent', authenticate, getRecentTransactions);

/**
 * @swagger
 * /api/transactions/import:
 *   post:
 *     summary: 导入交易记录
 *     tags: [交易]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV文件
 *     responses:
 *       200:
 *         description: 成功导入交易记录
 */
router.post('/transactions/import', authenticate, upload.single('file'), importTransactions);

/**
 * @swagger
 * /api/transactions/export:
 *   get:
 *     summary: 导出交易记录
 *     tags: [交易]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: 开始日期
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: 结束日期
 *       - in: query
 *         name: family_id
 *         schema:
 *           type: number
 *         description: 家庭ID
 *     responses:
 *       200:
 *         description: 成功导出交易记录
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export', authenticate, exportTransactions);

export default router;
