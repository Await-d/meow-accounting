import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
    getBackups,
    createBackup,
    restoreBackup,
    deleteBackup
} from '../controllers/backup.controller';

const router = Router();

router.use(authMiddleware);

// 备份列表
router.get('/', getBackups);

// 创建备份
router.post('/', createBackup);

// 恢复备份
router.post('/:id/restore', restoreBackup);

// 删除备份
router.delete('/:id', deleteBackup);

export default router;
