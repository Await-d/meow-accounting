/*
 * @Author: Await
 * @Date: 2025-03-10 19:47:51
 * @LastEditors: Await
 * @LastEditTime: 2025-03-11 20:57:20
 * @Description: 请填写简介
 */
'use client';

import React from 'react';
import { Card, CardBody } from '@nextui-org/react';

export default function SettingsPage() {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">欢迎使用系统设置</h2>
            <Card>
                <CardBody>
                    <p className="text-gray-600">
                        请从左侧菜单选择要管理的设置项：
                    </p>
                    <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                        <li>个人资料 - 修改您的个人信息</li>
                        <li>安全设置 - 管理账户安全选项</li>
                        <li>隐私设置 - 控制数据访问权限</li>
                        <li>分类管理 - 整理您的内容分类</li>
                        <li>家庭管理 - 管理家庭成员</li>
                        <li>邀请管理 - 处理邀请请求</li>
                        <li>路由管理 - 配置系统路由</li>
                        <li>缓存管理 - 清理系统缓存</li>
                        <li>自定义设置 - 个性化您的使用体验</li>
                    </ul>
                </CardBody>
            </Card>
        </div>
    );
} 