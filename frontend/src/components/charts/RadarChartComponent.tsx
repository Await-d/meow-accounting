/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 雷达图组件
 */
'use client';

import React from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { colors, cardStyles, emptyStateStyles } from '@/styles/design-system';

interface RadarData {
    subject: string;
    value: number;
    fullMark?: number;
}

interface RadarChartComponentProps {
    data: RadarData[];
    title?: string;
    color?: string;
    height?: number;
}

export function RadarChartComponent({
    data,
    title = '雷达图分析',
    color = colors.primary.DEFAULT,
    height = 400
}: RadarChartComponentProps) {
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

    return (
        <Card className={cardStyles.base}>
            <CardHeader>
                <h3 className="text-lg font-semibold">{title}</h3>
            </CardHeader>
            <CardBody>
                <ResponsiveContainer width="100%" height={height}>
                    <RadarChart data={data}>
                        <PolarGrid strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                        <Radar
                            name="指标"
                            dataKey="value"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.6}
                        />
                        <Tooltip />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </CardBody>
        </Card>
    );
}
