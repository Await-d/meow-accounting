/*
 * @Author: Await
 * @Date: 2025-03-12 21:50:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:56:28
 * @Description: 路由性能统计组件
 */
'use client';

import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    CardBody
} from '@nextui-org/react';
import { Route } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { getRouteStats } from '@/lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

interface RouteStatsProps {
    isOpen: boolean;
    onClose: () => void;
    route?: Route;
}

const COLORS = ['#00C49F', '#FF8042', '#FFBB28', '#FF0000'];

export function RouteStats({ isOpen, onClose, route }: RouteStatsProps) {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['route-stats', route?.id],
        queryFn: () => getRouteStats(route?.id as number),
        enabled: isOpen && !!route?.id
    });

    if (!route) return null;

    const accessData = stats?.accessHistory?.map((item: { timestamp: string; loadTime: number; errorCount: number }) => ({
        time: new Date(item.timestamp).toLocaleString(),
        loadTime: item.loadTime,
        errorCount: item.errorCount
    })) || [];

    const pieData = [
        { name: '成功访问', value: stats?.totalAccesses || 0 },
        { name: '缓存命中', value: stats?.cacheHits || 0 },
        { name: '错误次数', value: stats?.totalErrors || 0 }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader>
                    路由性能统计 - {route.name}
                </ModalHeader>
                <ModalBody className="space-y-6">
                    {isLoading ? (
                        <div>加载中...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardBody>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-500">总访问次数</div>
                                            <div className="text-2xl font-bold">{stats?.totalAccesses || 0}</div>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-500">平均加载时间</div>
                                            <div className="text-2xl font-bold">{stats?.averageLoadTime?.toFixed(2) || 0}ms</div>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody>
                                        <div className="text-center">
                                            <div className="text-sm text-gray-500">错误率</div>
                                            <div className="text-2xl font-bold">
                                                {((stats?.totalErrors || 0) / (stats?.totalAccesses || 1) * 100).toFixed(2)}%
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>

                            <Card>
                                <CardBody>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={accessData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="time" />
                                                <YAxis yAxisId="left" />
                                                <YAxis yAxisId="right" orientation="right" />
                                                <Tooltip />
                                                <Legend />
                                                <Line
                                                    yAxisId="left"
                                                    type="monotone"
                                                    dataKey="loadTime"
                                                    stroke="#8884d8"
                                                    name="加载时间(ms)"
                                                />
                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="errorCount"
                                                    stroke="#ff0000"
                                                    name="错误次数"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardBody>
                            </Card>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onPress={onClose}>
                        关闭
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 