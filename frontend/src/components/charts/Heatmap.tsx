/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 高级数据可视化组件 - 热力图
 */
'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/react';
import { colors, cardStyles, emptyStateStyles, typography, animation } from '@/styles/design-system';

interface HeatmapData {
    x: string | number;
    y: string | number;
    value: number;
    label?: string;
}

interface HeatmapProps {
    data: HeatmapData[];
    title?: string;
    xLabel?: string;
    yLabel?: string;
    colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'teal';
    width?: number;
    height?: number;
}

export function Heatmap({
    data,
    title = '热力图',
    xLabel = 'X轴',
    yLabel = 'Y轴',
    colorScheme = 'blue',
    width = 600,
    height = 400
}: HeatmapProps) {
    if (!data || data.length === 0) {
        return (
            <Card className={cardStyles.base}>
                <CardHeader>
                    <h3 className="text-lg font-semibold">{title}</h3>
                </CardHeader>
                <CardBody>
                    <div className={emptyStateStyles.container}>
                        <p className={emptyStateStyles.description}>暂无数据</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // 获取唯一的X和Y值
    const xValues = Array.from(new Set(data.map(d => d.x))).sort();
    const yValues = Array.from(new Set(data.map(d => d.y))).sort();

    // 找到最大值用于颜色归一化
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    // 使用统一的颜色方案
    const chartColors = colors.charts[colorScheme];

    // 计算颜色
    const getColor = (value: number) => {
        if (maxValue === minValue) return chartColors[4];
        const normalized = (value - minValue) / (maxValue - minValue);
        const index = Math.floor(normalized * (chartColors.length - 1));
        return chartColors[Math.min(index, chartColors.length - 1)];
    };

    // 计算单元格大小
    const cellWidth = (width - 100) / xValues.length;
    const cellHeight = (height - 100) / yValues.length;

    return (
        <Card className={cardStyles.base}>
            <CardHeader>
                <h3 className="text-lg font-semibold">{title}</h3>
            </CardHeader>
            <CardBody>
                <div className="overflow-x-auto">
                    <svg width={width} height={height} className="mx-auto">
                        {/* Y轴标签 */}
                        <text
                            x={20}
                            y={height / 2}
                            transform={`rotate(-90 20 ${height / 2})`}
                            textAnchor="middle"
                            className="text-sm fill-current"
                        >
                            {yLabel}
                        </text>

                        {/* X轴标签 */}
                        <text
                            x={width / 2}
                            y={height - 10}
                            textAnchor="middle"
                            className="text-sm fill-current"
                        >
                            {xLabel}
                        </text>

                        {/* 热力图单元格 */}
                        <g transform="translate(60, 20)">
                            {data.map((item, idx) => {
                                const xIndex = xValues.indexOf(item.x);
                                const yIndex = yValues.indexOf(item.y);

                                return (
                                    <g key={idx}>
                                        <rect
                                            x={xIndex * cellWidth}
                                            y={yIndex * cellHeight}
                                            width={cellWidth - 2}
                                            height={cellHeight - 2}
                                            fill={getColor(item.value)}
                                            className="cursor-pointer transition-opacity hover:opacity-80"
                                        >
                                            <title>{`${item.label || `${item.x}, ${item.y}`}: ${item.value}`}</title>
                                        </rect>
                                        {cellWidth > 40 && cellHeight > 30 && (
                                            <text
                                                x={xIndex * cellWidth + cellWidth / 2}
                                                y={yIndex * cellHeight + cellHeight / 2}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="text-xs fill-current pointer-events-none"
                                            >
                                                {item.value}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>

                        {/* X轴刻度 */}
                        <g transform="translate(60, 20)">
                            {xValues.map((x, idx) => (
                                <text
                                    key={idx}
                                    x={idx * cellWidth + cellWidth / 2}
                                    y={yValues.length * cellHeight + 20}
                                    textAnchor="middle"
                                    className="text-xs fill-current"
                                >
                                    {String(x).length > 10 ? String(x).substring(0, 10) + '...' : x}
                                </text>
                            ))}
                        </g>

                        {/* Y轴刻度 */}
                        <g transform="translate(60, 20)">
                            {yValues.map((y, idx) => (
                                <text
                                    key={idx}
                                    x={-10}
                                    y={idx * cellHeight + cellHeight / 2}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    className="text-xs fill-current"
                                >
                                    {String(y).length > 10 ? String(y).substring(0, 10) + '...' : y}
                                </text>
                            ))}
                        </g>
                    </svg>

                    {/* 图例 */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <span className="text-sm text-default-500">低</span>
                        <div className="flex gap-1">
                            {chartColors.map((color, idx) => (
                                <div
                                    key={idx}
                                    className="w-8 h-4 rounded"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-default-500">高</span>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
