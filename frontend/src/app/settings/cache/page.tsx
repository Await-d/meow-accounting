/*
 * @Author: Await
 * @Date: 2025-03-11 20:51:31
 * @LastEditors: Await
 * @LastEditTime: 2025-03-11 20:54:22
 * @Description: 请填写简介
 */
'use client';

import React from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CacheManager } from '@/lib/cache';

const CacheSettingsPage = () => {
    const handleClearCache = async (type: string) => {
        try {
            const cacheManager = CacheManager.getInstance();

            switch (type) {
                case 'route':
                    await cacheManager.clearRouteCache();
                    toast.success('路由缓存已清除');
                    break;
                case 'user':
                    await cacheManager.clearUserCache();
                    toast.success('用户数据缓存已清除');
                    break;
                case 'app':
                    await cacheManager.clearAppCache();
                    toast.success('应用缓存已清除');
                    break;
                case 'all':
                    await cacheManager.clearAllCache();
                    toast.success('所有缓存已清除');
                    break;
                default:
                    toast.error('未知的缓存类型');
            }
        } catch (error) {
            console.error('清除缓存失败:', error);
            toast.error('清除缓存失败');
        }
    };

    const cacheTypes = [
        {
            title: '路由缓存',
            description: '清除路由访问记录和相关数据',
            type: 'route'
        },
        {
            title: '用户数据缓存',
            description: '清除本地存储的用户偏好设置',
            type: 'user'
        },
        {
            title: '应用缓存',
            description: '清除应用程序缓存数据',
            type: 'app'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">缓存管理</h2>
                <Button
                    color="primary"
                    variant="flat"
                    startContent={<RefreshCw size={18} />}
                    onClick={() => handleClearCache('all')}
                >
                    清除所有缓存
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cacheTypes.map((cache) => (
                    <Card key={cache.type} className="w-full">
                        <CardBody className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium">{cache.title}</h3>
                                <p className="text-sm text-gray-500">{cache.description}</p>
                            </div>
                            <Button
                                color="danger"
                                variant="light"
                                startContent={<Trash2 size={18} />}
                                onClick={() => handleClearCache(cache.type)}
                            >
                                清除缓存
                            </Button>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CacheSettingsPage; 