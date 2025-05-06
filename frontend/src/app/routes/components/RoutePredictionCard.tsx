import React from 'react';
import { Card, CardBody, CardFooter, Button, Chip } from '@nextui-org/react';
import { TrendingUp, Clock, ExternalLink } from 'lucide-react';

interface RoutePrediction {
    path: string;
    name: string;
    confidence: number;
    lastAccess: string;
    accessCount: number;
}

interface RoutePredictionCardProps {
    prediction: RoutePrediction;
    isLoading?: boolean;
}

export function RoutePredictionCard({ prediction, isLoading = false }: RoutePredictionCardProps) {
    if (isLoading) {
        return (
            <Card className="h-40">
                <CardBody className="flex items-center justify-center">
                    <div className="animate-pulse">
                        <div className="h-4 bg-default-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-default-200 rounded w-1/2"></div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // 如果没有预测数据，显示空状态
    if (!prediction || !prediction.path) {
        return (
            <Card className="h-40">
                <CardBody className="flex items-center justify-center">
                    <p className="text-default-500 text-center">暂无预测数据</p>
                </CardBody>
            </Card>
        );
    }

    // 获取置信度颜色
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'success';
        if (confidence >= 50) return 'warning';
        return 'danger';
    };

    return (
        <Card>
            <CardBody className="gap-2">
                <div className="flex justify-between">
                    <h3 className="text-md font-semibold">{prediction.name || '未命名路由'}</h3>
                    <Chip
                        color={getConfidenceColor(prediction.confidence) as any}
                        size="sm"
                        startContent={<TrendingUp size={12} />}
                    >
                        {prediction.confidence}% 可能性
                    </Chip>
                </div>
                <p className="text-default-500 text-xs">{prediction.path}</p>
                <div className="flex items-center gap-1 text-xs text-default-400">
                    <Clock size={12} />
                    <span>最近访问: {new Date(prediction.lastAccess).toLocaleString()}</span>
                </div>
                <div className="text-xs text-default-400">
                    访问次数: {prediction.accessCount}
                </div>
            </CardBody>
            <CardFooter>
                <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    startContent={<ExternalLink size={14} />}
                    as="a"
                    href={prediction.path}
                    fullWidth
                >
                    访问路由
                </Button>
            </CardFooter>
        </Card>
    );
} 