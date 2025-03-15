'use client';

import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Input } from '@nextui-org/react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value?: Date;
    onChange: (date?: Date) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export default function DatePicker({ value, onChange, label, placeholder = '选择日期', className }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleDateChange = (date: Date | undefined) => {
        onChange(date);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
    };

    return (
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger>
                <Input
                    label={label}
                    placeholder={placeholder}
                    value={value ? format(value, 'yyyy-MM-dd', { locale: zhCN }) : ''}
                    readOnly
                    classNames={{
                        input: "cursor-pointer",
                    }}
                    endContent={
                        <div className="flex items-center">
                            {value && (
                                <button
                                    onClick={handleClear}
                                    className="text-default-400 hover:text-default-900 focus:outline-none mr-2"
                                >
                                    ✕
                                </button>
                            )}
                            <CalendarIcon className="h-5 w-5 text-default-400" />
                        </div>
                    }
                    className={className}
                />
            </PopoverTrigger>
            <PopoverContent>
                <div className="p-1">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDateChange}
                        initialFocus
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

// 简化的日历组件
function Calendar({ mode, selected, onSelect, initialFocus }: any) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const [currentMonth, setCurrentMonth] = useState(selected || new Date());

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const prevMonth = () => {
        setCurrentMonth(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(year, month + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const date = new Date(year, month, day);
        onSelect(date);
    };

    // 生成日历网格
    const calendarGrid = [];
    let dayCounter = 1;

    for (let i = 0; i < 6; i++) {
        const week = [];
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                week.push(null);
            } else if (dayCounter <= daysInMonth) {
                week.push(dayCounter);
                dayCounter++;
            } else {
                week.push(null);
            }
        }
        calendarGrid.push(week);
    }

    return (
        <div className="p-3">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1">
                    &lt;
                </button>
                <h3>{format(currentMonth, 'yyyy年MM月', { locale: zhCN })}</h3>
                <button onClick={nextMonth} className="p-1">
                    &gt;
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {days.map(day => (
                    <div key={day} className="text-sm font-medium">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarGrid.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                        {week.map((day, dayIndex) => (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                className={cn(
                                    "h-8 w-8 p-0 flex items-center justify-center rounded-full text-sm",
                                    day === null ? "invisible" : "cursor-pointer hover:bg-primary-100",
                                    selected && day === selected.getDate() && month === selected.getMonth() && year === selected.getFullYear()
                                        ? "bg-primary text-white"
                                        : ""
                                )}
                                onClick={() => day !== null && handleDateClick(day)}
                            >
                                {day}
                            </div>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
} 