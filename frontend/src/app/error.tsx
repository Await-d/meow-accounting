/*
 * @Author: Await
 * @Date: 2025-03-04 19:13:07
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:13:39
 * @Description: 请填写简介
 */
'use client';

import { useEffect } from 'react';
import { Button, Card, CardBody } from '@nextui-org/react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // 记录错误到错误追踪服务
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="max-w-lg w-full">
                <CardBody className="text-center space-y-4">
                    <h2 className="text-xl font-bold">出错了</h2>
                    <p className="text-default-500">
                        {error.message || '发生了一些错误，请稍后再试。'}
                    </p>
                    <div className="flex justify-center gap-2">
                        <Button
                            color="primary"
                            onPress={() => reset()}
                        >
                            重试
                        </Button>
                        <Button
                            variant="bordered"
                            onPress={() => window.location.href = '/'}
                        >
                            返回首页
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
} 