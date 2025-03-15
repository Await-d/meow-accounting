/// <reference lib="webworker" />

/*
 * @Author: Await
 * @Date: 2025-03-04 19:19:35
 * @LastEditors: Await
 * @LastEditTime: 2025-03-14 19:57:06
 * @Description: 请填写简介
 */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// 预缓存
precacheAndRoute(self.__WB_MANIFEST);

// API请求缓存策略
registerRoute(
    ({ url }) => url.pathname.startsWith('/api'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5分钟
            }),
        ],
    })
);

// 静态资源缓存策略
registerRoute(
    ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker',
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
    })
);

// 图片缓存策略
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
            }),
        ],
    })
);

// 字体缓存策略
registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
        cacheName: 'fonts',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
            }),
        ],
    })
);

// 离线页面
const FALLBACK_HTML_URL = '/offline.html';
self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open('offline-html').then((cache) => cache.add(FALLBACK_HTML_URL))
    );
});

// 处理离线请求
self.addEventListener('fetch', (event: FetchEvent) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(async () => {
                const cache = await caches.match(FALLBACK_HTML_URL);
                if (cache) return cache;
                throw new Error('offline');
            })
        );
    }
}); 