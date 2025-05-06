import React from 'react';
import { Button, Popover, PopoverTrigger, PopoverContent, Input } from '@nextui-org/react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
    value: {
        startDate: Date;
        endDate: Date;
    };
    onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const { startDate, endDate } = value;

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = new Date(e.target.value);
        if (!isNaN(newStartDate.getTime())) {
            onChange({
                startDate: newStartDate,
                endDate
            });
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEndDate = new Date(e.target.value);
        if (!isNaN(newEndDate.getTime())) {
            onChange({
                startDate,
                endDate: newEndDate
            });
        }
    };

    // 预设范围选择
    const presetRanges = [
        { label: '今天', days: 0 },
        { label: '过去7天', days: 7 },
        { label: '过去30天', days: 30 },
        { label: '过去90天', days: 90 },
    ];

    const handlePresetRangeSelect = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        onChange({
            startDate: start,
            endDate: end
        });
    };

    // 格式化日期为YYYY-MM-DD
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    return (
        <Popover placement="bottom">
            <PopoverTrigger>
                <Button
                    variant="flat"
                    startContent={<Calendar size={16} />}
                >
                    {formatDateForInput(startDate)} 至 {formatDateForInput(endDate)}
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <div className="p-4 w-80">
                    <h4 className="text-sm font-medium mb-4">选择日期范围</h4>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                label="开始日期"
                                value={formatDateForInput(startDate)}
                                onChange={handleStartDateChange}
                                max={formatDateForInput(endDate)}
                            />
                            <Input
                                type="date"
                                label="结束日期"
                                value={formatDateForInput(endDate)}
                                onChange={handleEndDateChange}
                                min={formatDateForInput(startDate)}
                                max={formatDateForInput(new Date())}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {presetRanges.map((range) => (
                                <Button
                                    key={range.label}
                                    size="sm"
                                    variant="flat"
                                    onPress={() => handlePresetRangeSelect(range.days)}
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
} 