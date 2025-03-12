/*
 * @Author: Await
 * @Date: 2025-03-10 22:00:31
 * @LastEditors: Await
 * @LastEditTime: 2025-03-11 20:51:03
 * @Description: 请填写简介
 */
import {Router} from 'express';
import {cache} from '../utils/cache';
import {authenticate, isAdmin} from '../middlewares/auth';

const router = Router();

// 获取缓存统计信息
router.get('/stats', authenticate, isAdmin, async (req, res) => {
    try {
        const redisStats = await cache.getStats();
        const localStats = cache.getLocalCacheStats();

        res.json({
            redis: redisStats,
            local: localStats,
            total: {
                keys: redisStats.keys + localStats.size,
                memory: redisStats.memory,
                hits: redisStats.hits,
                misses: redisStats.misses,
                hitRate: redisStats.hits / (redisStats.hits + redisStats.misses) || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            error: '获取缓存统计失败',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// 清除指定模式的缓存
router.delete('/pattern/:pattern', authenticate, isAdmin, async (req, res) => {
    try {
        const {pattern} = req.params;
        const deletedCount = await cache.delByPattern(pattern);
        res.json({deletedCount});
    } catch (error) {
        res.status(500).json({
            error: '清除缓存失败',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// 清除所有缓存
router.delete('/all', authenticate, isAdmin, async (req, res) => {
    try {
        await cache.clear();
        res.json({message: '所有缓存已清除'});
    } catch (error) {
        res.status(500).json({
            error: '清除所有缓存失败',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// 预热指定的缓存键
router.post('/warmup', authenticate, isAdmin, async (req, res) => {
    try {
        const {keys} = req.body;
        if (!Array.isArray(keys)) {
            return res.status(400).json({error: 'keys必须是字符串数组'});
        }

        await cache.warmup(keys);
        res.json({message: '缓存预热完成'});
    } catch (error) {
        res.status(500).json({
            error: '缓存预热失败',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

// 监控内存使用
router.get('/memory', authenticate, isAdmin, async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold as string) || 0.8;
        await cache.monitorMemory(threshold);
        res.json({message: '内存监控正常'});
    } catch (error) {
        res.status(500).json({
            error: '内存监控失败',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

export default router;
