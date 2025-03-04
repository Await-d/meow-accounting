/*
 * @Author: Await
 * @Date: 2025-03-04 19:38:57
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:39:17
 * @Description: 请填写简介
 */
import { Router } from 'express';
import { getCategoryStats } from '../controllers/statistics.controller';

const router = Router();

router.get('/categories', getCategoryStats);

export default router; 