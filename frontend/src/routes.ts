import { Database } from 'lucide-react';
import CacheManager from './components/CacheManager';

export const routes = [
    {
        path: '/cache',
        element: CacheManager,
        name: '缓存管理',
        icon: Database,
        auth: true
    }
]; 