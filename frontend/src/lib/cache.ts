export class CacheManager {
    private static instance: CacheManager;
    private constructor() { }

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    async clearRouteCache(): Promise<void> {
        try {
            localStorage.removeItem('route_history');
            localStorage.removeItem('route_analytics');
        } catch (error) {
            console.error('清除路由缓存失败:', error);
            throw error;
        }
    }

    async clearUserCache(): Promise<void> {
        try {
            localStorage.removeItem('user_preferences');
            localStorage.removeItem('user_settings');
            sessionStorage.removeItem('user_session');
        } catch (error) {
            console.error('清除用户缓存失败:', error);
            throw error;
        }
    }

    async clearAppCache(): Promise<void> {
        try {
            // 清除应用相关的缓存
            const cacheKeys = Object.keys(localStorage);
            const appCacheKeys = cacheKeys.filter(key =>
                !key.startsWith('route_') &&
                !key.startsWith('user_')
            );

            appCacheKeys.forEach(key => localStorage.removeItem(key));

            // 清除 Service Worker 缓存
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // 清除 Cache API 缓存
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
        } catch (error) {
            console.error('清除应用缓存失败:', error);
            throw error;
        }
    }

    async clearAllCache(): Promise<void> {
        try {
            await Promise.all([
                this.clearRouteCache(),
                this.clearUserCache(),
                this.clearAppCache()
            ]);
        } catch (error) {
            console.error('清除所有缓存失败:', error);
            throw error;
        }
    }
} 