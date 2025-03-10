/*
 * @Author: Await
 * @Date: 2025-03-08 21:12:42
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 20:53:30
 * @Description: 请填写简介
 */
'use client';

import { useState } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
} from '@nextui-org/react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useExportTransactions } from '@/lib/api';
import { useToast } from './Toast';
import dayjs from 'dayjs';

interface TransactionExportProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TransactionExport({ isOpen, onClose }: TransactionExportProps) {
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
    const { mutate: exportTransactions, isPending } = useExportTransactions();
    const { showToast } = useToast();

    const handleExport = async () => {
        if (!startDate || !endDate) {
            showToast('请选择日期范围', 'error');
            return;
        }

        if (dayjs(startDate).isAfter(endDate)) {
            showToast('开始日期不能晚于结束日期', 'error');
            return;
        }

        try {
            await exportTransactions({ startDate, endDate });
            onClose();
        } catch (error) {
            console.error('导出失败:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>导出交易记录</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <p className="text-sm text-default-500">
                            请选择要导出的日期范围：
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="开始日期"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input
                                type="date"
                                label="结束日期"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="bordered" onPress={onClose}>
                        取消
                    </Button>
                    <Button
                        color="primary"
                        startContent={<ArrowDownTrayIcon className="h-4 w-4" />}
                        onPress={handleExport}
                        isLoading={isPending}
                    >
                        导出
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 