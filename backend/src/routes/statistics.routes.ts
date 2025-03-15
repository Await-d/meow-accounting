/*
 * @Author: Await
 * @Date: 2025-03-04 19:38:57
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:39:17
 * @Description: 请填写简介
 */
import express from 'express';
import { getTransactionStats, getCategoryStats } from '../controllers/statistics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/transactions/stats:
 *   get:
 *     summary: 获取交易统计数据
 *     tags: [统计]
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
 *         description: 成功返回统计数据
 */
router.get('/transactions/stats', authenticate, getTransactionStats);

/**
 * @swagger
 * /api/transactions/stats/category:
 *   get:
 *     summary: 获取分类统计数据
 *     tags: [统计]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: 时间范围
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
 *         description: 成功返回分类统计数据
 */
router.get('/transactions/stats/category', authenticate, getCategoryStats);

export default router; 