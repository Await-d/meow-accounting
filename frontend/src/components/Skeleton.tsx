/*
 * @Author: Await
 * @Date: 2025-03-04 19:08:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:09:43
 * @Description: 请填写简介
 */
import { Card, CardBody, Skeleton as NextUISkeleton } from '@nextui-org/react';

interface SkeletonProps {
    type?: 'transaction' | 'statistics' | 'category';
}

export default function Skeleton({ type = 'transaction' }: SkeletonProps) {
    if (type === 'statistics') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="w-full">
                        <CardBody className="space-y-3">
                            <NextUISkeleton className="rounded-lg">
                                <div className="h-3 w-3/4 rounded-lg bg-default-200"></div>
                            </NextUISkeleton>
                            <NextUISkeleton className="rounded-lg">
                                <div className="h-6 w-2/3 rounded-lg bg-default-200"></div>
                            </NextUISkeleton>
                        </CardBody>
                    </Card>
                ))}
            </div>
        );
    }

    if (type === 'category') {
        return (
            <Card className="w-full">
                <CardBody className="space-y-4">
                    <div className="flex justify-between items-center">
                        <NextUISkeleton className="rounded-lg">
                            <div className="h-6 w-32 rounded-lg bg-default-200"></div>
                        </NextUISkeleton>
                        <NextUISkeleton className="rounded-lg">
                            <div className="h-8 w-48 rounded-lg bg-default-200"></div>
                        </NextUISkeleton>
                    </div>
                    <NextUISkeleton className="rounded-lg">
                        <div className="h-[300px] w-full rounded-lg bg-default-200"></div>
                    </NextUISkeleton>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="w-full">
                                <CardBody className="space-y-2">
                                    <NextUISkeleton className="rounded-lg">
                                        <div className="h-3 w-3/4 rounded-lg bg-default-200"></div>
                                    </NextUISkeleton>
                                    <NextUISkeleton className="rounded-lg">
                                        <div className="h-5 w-2/3 rounded-lg bg-default-200"></div>
                                    </NextUISkeleton>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="w-full">
                    <CardBody>
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <NextUISkeleton className="rounded-lg">
                                    <div className="h-3 w-24 rounded-lg bg-default-200"></div>
                                </NextUISkeleton>
                                <NextUISkeleton className="rounded-lg">
                                    <div className="h-3 w-32 rounded-lg bg-default-200"></div>
                                </NextUISkeleton>
                            </div>
                            <NextUISkeleton className="rounded-lg">
                                <div className="h-6 w-20 rounded-lg bg-default-200"></div>
                            </NextUISkeleton>
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    );
}