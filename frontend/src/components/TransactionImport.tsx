'use client';

import React, { useCallback, useState } from 'react';
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
import { useToast } from './Toast';
import { useTransactions } from '@/lib/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function TransactionImport({ isOpen, onClose }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();
    const { refetch } = useTransactions({});

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv') {
                showToast('请选择 CSV 文件', 'error');
                return;
            }
            setFile(selectedFile);
        }
    }, [showToast]);

    const handleUpload = useCallback(async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/transactions/import', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('导入失败');
            }

            const data = await response.json();
            showToast(`成功导入 ${data.count} 条交易记录`, 'success');

            await refetch();
            onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : '导入失败，请稍后重试', 'error');
        } finally {
            setIsUploading(false);
        }
    }, [file, onClose, refetch, showToast]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>导入交易记录</ModalHeader>
                <ModalBody>
                    <div className="space-y-4">
                        <p className="text-sm text-default-500">
                            请选择要导入的 CSV 文件。文件格式要求：
                        </p>
                        <ul className="list-disc list-inside text-sm text-default-500">
                            <li>必须包含以下列：日期、金额、类型、描述</li>
                            <li>日期格式：YYYY-MM-DD</li>
                            <li>金额格式：数字，支持小数点</li>
                            <li>类型：收入/支出</li>
                        </ul>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            startContent={<ArrowUpTrayIcon className="h-4 w-4" />}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="primary"
                        onPress={handleUpload}
                        isDisabled={!file}
                        isLoading={isUploading}
                    >
                        导入
                    </Button>
                    <Button variant="light" onPress={onClose}>
                        取消
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 