'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Tabs, Tab } from '@nextui-org/react';
import { useRoute } from '@/hooks/useRoute';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

// 图表颜色
const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

export default function RouteAnalytics() {
    const { getPerformanceReport, userRoutes, familyRoutes } = useRoute();
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState<any>(null);

    const report = getPerformanceReport();

    // 准备图表数据
    const performanceData = [
        { name: '总访问量', value: report.totalAccesses },
        { name: '错误次数', value: report.totalErrors },
        { name: '平均加载时间(ms)', value: Math.round(report.averageLoadTime) }
    ];

    // 路由访问分布数据
    const routeAccessData = [...userRoutes, ...familyRoutes]
        .map(route => ({
            name: route.name,
            value: report.routeStats?.[route.path]?.accessCount || 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7); // 只取前7个

    // 加载时间数据
    const loadTimeData = [...userRoutes, ...familyRoutes]
        .map(route => ({
            name: route.name,
            value: report.routeStats?.[route.path]?.averageLoadTime || 0
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7); // 只取前7个

    // 刷新数据
    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        const routeStats = report.routeStats || {};

        // 处理饼图数据
        const pieData = Object.entries(routeStats).map(([path, stats]: [string, any]) => ({
            name: path,
            value: stats.accessCount
        }));

        // 处理折线图数据
        const lineData = Object.entries(routeStats).map(([path, stats]: [string, any]) => ({
            name: path,
            loadTime: stats.averageLoadTime,
            errors: stats.errorCount
        }));

        setData({ pieData, lineData });
    }, [report.routeStats]);

    if (!data) return null;

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-bold">路由分析</h2>
                <Button
                    color="primary"
                    size="sm"
                    onClick={handleRefresh}
                >
                    刷新数据
                </Button>
            </CardHeader>
            <CardBody className="gap-6">
                {/* 概览数据 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardBody>
                            <div className="text-center">
                                <p className="text-sm text-default-500">总路由数</p>
                                <p className="text-2xl font-bold">{report.totalRoutes}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <div className="text-center">
                                <p className="text-sm text-default-500">总访问量</p>
                                <p className="text-2xl font-bold">{report.totalAccesses}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <div className="text-center">
                                <p className="text-sm text-default-500">错误率</p>
                                <p className="text-2xl font-bold">
                                    {((report.totalErrors / report.totalAccesses) * 100).toFixed(2)}%
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* 图表标签页 */}
                <Tabs selectedKey={activeTab} onSelectionChange={setActiveTab as any}>
                    <Tab key="overview" title="总览">
                        <div className="w-full overflow-x-auto h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Tab>
                    <Tab key="access" title="访问分布">
                        <div className="w-full overflow-x-auto h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {data.pieData.map((entry: any, index: number) => (
                                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Tab>
                    <Tab key="performance" title="加载时间">
                        <div className="w-full overflow-x-auto h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.lineData}>
                                    <Line type="monotone" dataKey="loadTime" stroke="#8884d8" name="加载时间" />
                                    <Line type="monotone" dataKey="errors" stroke="#ff0000" name="错误数" />
                                    <Tooltip />
                                    <Legend />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Tab>
                </Tabs>

                {/* 详细数据表格 */}
                <Table aria-label="路由分析详情">
                    <TableHeader>
                        <TableColumn>指标</TableColumn>
                        <TableColumn>数值</TableColumn>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>平均加载时间</TableCell>
                            <TableCell>{report.averageLoadTime.toFixed(2)}ms</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>访问最多的路由</TableCell>
                            <TableCell>{report.mostAccessed?.path || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>错误最多的路由</TableCell>
                            <TableCell>{report.mostErrors?.path || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>缓存命中率</TableCell>
                            <TableCell>{(report.cacheHitRate * 100).toFixed(2)}%</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardBody>
        </Card>
    );
} 