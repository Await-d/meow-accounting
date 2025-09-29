import React, { useState, useEffect, ChangeEvent } from 'react';
import {
    Card,
    Table,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Input,
    Progress,
    Tabs,
    Tab,
    TableHeader
} from '@nextui-org/react';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { useToast } from '@/components/Toast';
// Temporary cache API stubs
interface CacheStats {
    totalKeys: number;
    memoryUsage: number;
    hitRate: number;
    redis: {
        keys: number;
        memory: number;
        hits: number;
        misses: number;
    };
    local: {
        size: number;
        capacity: number;
    };
    total: {
        keys: number;
        memory: number;
        hits: number;
        misses: number;
        hitRate: number;
    };
}

const getCacheStats = async (): Promise<CacheStats> => ({
    totalKeys: 0,
    memoryUsage: 0,
    hitRate: 0,
    redis: { keys: 0, memory: 0, hits: 0, misses: 0 },
    local: { size: 0, capacity: 100 },
    total: { keys: 0, memory: 0, hits: 0, misses: 0, hitRate: 0 }
});
const clearCachePattern = async (pattern: string): Promise<void> => {};
const clearAllCache = async (): Promise<void> => {};
const monitorMemory = (threshold?: number): void => {};

const CacheManager: React.FC = () => {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [pattern, setPattern] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');
    const { showToast } = useToast();

    const fetchStats = async () => {
        try {
            const data = await getCacheStats();
            setStats(data);
        } catch (error) {
            showToast('获取缓存统计失败', 'error');
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // 每30秒更新一次
        return () => clearInterval(interval);
    }, []);

    const handleClearPattern = async () => {
        if (!pattern) {
            showToast('请输入缓存模式', 'warning');
            return;
        }

        try {
            setLoading(true);
            const deletedCount = await clearCachePattern(pattern);
            showToast(`已清除 ${deletedCount} 个缓存项`, 'success');
            fetchStats();
        } catch (error) {
            showToast('清除缓存失败', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClearAll = async () => {
        try {
            setLoading(true);
            await clearAllCache();
            showToast('所有缓存已清除', 'success');
            fetchStats();
        } catch (error) {
            showToast('清除缓存失败', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMonitorMemory = async () => {
        try {
            await monitorMemory(0.8);
            showToast('内存监控正常', 'success');
        } catch (error) {
            showToast('内存监控失败', 'error');
        }
    };

    const statsData = stats ? [
        {
            metric: '缓存项数',
            redis: stats.redis.keys,
            local: stats.local.size,
            total: stats.total.keys,
        },
        {
            metric: '内存使用',
            redis: `${(stats.redis.memory / 1024 / 1024).toFixed(2)} MB`,
            local: 'N/A',
            total: `${(stats.total.memory / 1024 / 1024).toFixed(2)} MB`,
        },
        {
            metric: '命中次数',
            redis: stats.redis.hits,
            local: 'N/A',
            total: stats.total.hits,
        },
        {
            metric: '未命中次数',
            redis: stats.redis.misses,
            local: 'N/A',
            total: stats.total.misses,
        },
        {
            metric: '命中率',
            redis: `${((stats.redis.hits / (stats.redis.hits + stats.redis.misses)) * 100).toFixed(2)}%`,
            local: 'N/A',
            total: `${(stats.total.hitRate * 100).toFixed(2)}%`,
        },
    ] : [];

    return (
        <div className="p-6">
            <Tabs
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key as string)}
            >
                <Tab key="stats" title="缓存统计">
                    <div className="flex gap-4 mb-4">
                        <Button
                            color="primary"
                            startContent={<RefreshCw size={16} />}
                            onPress={fetchStats}
                            isLoading={loading}
                        >
                            刷新统计
                        </Button>
                        <Button
                            onPress={handleMonitorMemory}
                            isLoading={loading}
                        >
                            检查内存
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableColumn>指标</TableColumn>
                            <TableColumn>Redis缓存</TableColumn>
                            <TableColumn>本地缓存</TableColumn>
                            <TableColumn>总计</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {statsData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.metric}</TableCell>
                                    <TableCell>{row.redis}</TableCell>
                                    <TableCell>{row.local}</TableCell>
                                    <TableCell>{row.total}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {stats && (
                        <Card className="mt-4">
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2">缓存使用情况</h3>
                                <Progress
                                    value={Number(((stats.total.keys / (stats.local.capacity + stats.redis.keys)) * 100).toFixed(2))}
                                    color="primary"
                                />
                            </div>
                        </Card>
                    )}
                </Tab>

                <Tab key="manage" title="缓存管理">
                    <div className="flex flex-col gap-4">
                        <Card>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">清除指定模式的缓存</h3>
                                <div className="flex gap-4">
                                    <Input
                                        placeholder="输入缓存模式，如：user:*"
                                        value={pattern}
                                        onChange={(e) => setPattern(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        color="danger"
                                        startContent={<Trash2 size={16} />}
                                        onPress={handleClearPattern}
                                        isLoading={loading}
                                    >
                                        清除
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">清除所有缓存</h3>
                                <Button
                                    color="danger"
                                    startContent={<Trash2 size={16} />}
                                    onPress={handleClearAll}
                                    isLoading={loading}
                                >
                                    清除所有缓存
                                </Button>
                            </div>
                        </Card>
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
};

export default CacheManager; 