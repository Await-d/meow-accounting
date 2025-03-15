import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, CardBody, Input, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
    date: Date;
    setDate: (date: Date) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({ date, setDate, placeholder = "选择日期", className }: DatePickerProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    // 格式化显示的日期
    const formattedDate = date ? format(date, 'yyyy年MM月dd日', { locale: zhCN }) : '';

    // 关闭日期选择器
    const handleClose = () => {
        setIsPopoverOpen(false);
    };

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={className} ref={popoverRef}>
            <Popover placement="bottom" isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger>
                    <Input
                        type="text"
                        label="日期"
                        placeholder={placeholder}
                        value={formattedDate}
                        readOnly
                        onClick={() => setIsPopoverOpen(true)}
                        startContent={<CalendarIcon size={16} className="text-default-500" />}
                    />
                </PopoverTrigger>
                <PopoverContent>
                    <Card className="border-none">
                        <CardBody className="p-0">
                            <DayPicker
                                mode="single"
                                selected={date}
                                onSelect={(day) => {
                                    if (day) {
                                        setDate(day);
                                        handleClose();
                                    }
                                }}
                                locale={zhCN}
                                weekStartsOn={1}
                                footer={
                                    <div className="mt-3 flex justify-end">
                                        <Button
                                            variant="flat"
                                            size="sm"
                                            onPress={handleClose}
                                        >
                                            取消
                                        </Button>
                                    </div>
                                }
                                className="p-3"
                            />
                        </CardBody>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
} 