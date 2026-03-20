/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 桑基图组件
 */
'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/react';
import { colors, cardStyles, emptyStateStyles } from '@/styles/design-system';

interface SankeyNode {
    id: string;
    name: string;
}

interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

interface SankeyChartProps {
    nodes: SankeyNode[];
    links: SankeyLink[];
    title?: string;
    width?: number;
    height?: number;
}

export function SankeyChart({
    nodes,
    links,
    title = '资金流向分析',
    width = 800,
    height = 600
}: SankeyChartProps) {
    if (!nodes || nodes.length === 0 || !links || links.length === 0) {
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

    // 简化的桑基图实现
    // 计算节点位置
    const nodePositions: Record<string, { x: number; y: number; height: number }> = {};
    const padding = 50;
    const nodeWidth = 20;

    // 按层级分组节点
    const layers: string[][] = [];
    const visited = new Set<string>();
    const sources = new Set(links.map(l => l.source));
    const targets = new Set(links.map(l => l.target));

    // 第一层：只作为源的节点
    const layer0 = nodes.filter(n => sources.has(n.id) && !targets.has(n.id)).map(n => n.id);
    if (layer0.length > 0) layers.push(layer0);

    // 中间层和最后一层
    const remaining = nodes.filter(n => !layer0.includes(n.id));
    const layerMiddle = remaining.filter(n => sources.has(n.id) && targets.has(n.id)).map(n => n.id);
    const layerLast = remaining.filter(n => !sources.has(n.id) && targets.has(n.id)).map(n => n.id);

    if (layerMiddle.length > 0) layers.push(layerMiddle);
    if (layerLast.length > 0) layers.push(layerLast);

    // 计算每个节点的值（流入或流出的总和）
    const nodeValues: Record<string, number> = {};
    links.forEach(link => {
        nodeValues[link.source] = (nodeValues[link.source] || 0) + link.value;
        nodeValues[link.target] = (nodeValues[link.target] || 0) + link.value;
    });

    // 分配节点位置
    const layerWidth = (width - 2 * padding) / Math.max(layers.length - 1, 1);
    layers.forEach((layer, layerIdx) => {
        const layerHeight = height - 2 * padding;
        const nodeSpacing = layerHeight / (layer.length + 1);

        layer.forEach((nodeId, nodeIdx) => {
            const value = nodeValues[nodeId] || 1;
            const nodeHeight = Math.max(10, (value / Math.max(...Object.values(nodeValues))) * 100);

            nodePositions[nodeId] = {
                x: padding + layerIdx * layerWidth,
                y: padding + nodeSpacing * (nodeIdx + 1) - nodeHeight / 2,
                height: nodeHeight
            };
        });
    });

    // 使用统一的颜色方案
    const getLinkColor = (index: number) => colors.series[index % colors.series.length];

    return (
        <Card className={cardStyles.base}>
            <CardHeader>
                <h3 className="text-lg font-semibold">{title}</h3>
            </CardHeader>
            <CardBody>
                <div className="overflow-x-auto">
                    <svg width={width} height={height}>
                        {/* 绘制连接线 */}
                        {links.map((link, idx) => {
                            const source = nodePositions[link.source];
                            const target = nodePositions[link.target];

                            if (!source || !target) return null;

                            const sourceX = source.x + nodeWidth;
                            const sourceY = source.y + source.height / 2;
                            const targetX = target.x;
                            const targetY = target.y + target.height / 2;

                            const midX = (sourceX + targetX) / 2;

                            const path = `M ${sourceX},${sourceY} C ${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;

                            return (
                                <path
                                    key={idx}
                                    d={path}
                                    fill="none"
                                    stroke={getLinkColor(idx)}
                                    strokeWidth={Math.max(2, link.value / 10)}
                                    opacity={0.5}
                                    className="cursor-pointer hover:opacity-80"
                                >
                                    <title>{`${link.source} → ${link.target}: ${link.value}`}</title>
                                </path>
                            );
                        })}

                        {/* 绘制节点 */}
                        {nodes.map(node => {
                            const pos = nodePositions[node.id];
                            if (!pos) return null;

                            return (
                                <g key={node.id}>
                                    <rect
                                        x={pos.x}
                                        y={pos.y}
                                        width={nodeWidth}
                                        height={pos.height}
                                        fill={colors.primary.DEFAULT}
                                        className="cursor-pointer"
                                    >
                                        <title>{`${node.name}: ${nodeValues[node.id] || 0}`}</title>
                                    </rect>
                                    <text
                                        x={pos.x + nodeWidth + 5}
                                        y={pos.y + pos.height / 2}
                                        dominantBaseline="middle"
                                        className="text-sm fill-current"
                                    >
                                        {node.name}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </CardBody>
        </Card>
    );
}
