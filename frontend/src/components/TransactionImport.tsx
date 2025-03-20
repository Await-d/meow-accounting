/*
 * @Author: Await
 * @Date: 2025-03-05 21:38:09
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 21:04:49
 * @Description: 请填写简介
 */
'use client';

import { useState, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
} from '@nextui-org/react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useImportTransactions } from '@/hooks/useTransactions';
import { useToast } from './Toast';

interface TransactionImportProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TransactionImport({ isOpen, onClose }: TransactionImportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { mutate: importTransactions, isPending } = useImportTransactions();
    const { showToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'text/csv') {
                showToast('请选择CSV文件', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            showToast('请选择要导入的文件', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await importTransactions(formData);
            onClose();
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('导入失败:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>导入交易记录</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <p className="text-sm text-default-500">
                            请选择要导入的CSV文件，文件格式如下：
                        </p>
                        <pre className="text-xs bg-default-100 p-2 rounded-lg">
                            日期,类型,金额,分类,描述
                            2024-03-01,expense,100,餐饮,午餐
                            2024-03-02,income,5000,工资,3月工资
                        </pre>
                        <Input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            startContent={<ArrowUpTrayIcon className="h-4 w-4" />}
                            description="支持.csv格式文件"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="bordered" onPress={onClose}>
                        取消
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleImport}
                        isLoading={isPending}
                        isDisabled={!selectedFile}
                    >
                        导入
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 