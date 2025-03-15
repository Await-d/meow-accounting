/*
 * @Author: Await
 * @Date: 2025-03-14 18:43:15
 * @LastEditors: Await
 * @LastEditTime: 2025-03-14 18:43:57
 * @Description: 请填写简介
 */
import React from 'react';
import { ButtonGroup, Button } from '@nextui-org/react';

type TimeRangeProps = {
    value: 'month' | 'quarter' | 'year';
    onChange: (value: 'month' | 'quarter' | 'year') => void;
};

export default function TimeRangeSelector({ value, onChange }: TimeRangeProps) {
    return (
        <ButtonGroup size="sm" variant="flat">
            <Button
                className={value === 'month' ? 'bg-primary/20' : ''}
                onPress={() => onChange('month')}
            >
                月
            </Button>
            <Button
                className={value === 'quarter' ? 'bg-primary/20' : ''}
                onPress={() => onChange('quarter')}
            >
                季
            </Button>
            <Button
                className={value === 'year' ? 'bg-primary/20' : ''}
                onPress={() => onChange('year')}
            >
                年
            </Button>
        </ButtonGroup>
    );
} 