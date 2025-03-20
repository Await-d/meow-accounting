"use client";
import React from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input,
    Spinner
} from '@nextui-org/react';
import { useQuery } from '@tanstack/react-query';
import { Download, Upload, RefreshCcw, Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// 模拟备份数据
const mockBackups = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `backup_${new Date(Date.now() - i * 86400000).toISOString().split('T')[0]}.zip`,
    size: Math.floor(Math.random() * 1000) + 'MB',
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    type: ['完整备份', '增量备份'][Math.floor(Math.random() * 2)],
    status: '完成'
}));

export default function BackupPage() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [backupName, setBackupName] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    // 获取备份列表
    const { data: backups, refetch } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            // TODO: 实现实际的API调用
            await new Promise(resolve => setTimeout(resolve, 1000));
            return mockBackups;
        }
    });

    // 处理创建备份
    const handleCreateBackup = async () => {
        setIsLoading(true);
        try {
            // TODO: 实现实际的备份创建逻辑
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('备份创建成功');
            onClose();
            refetch();
        } catch (error) {
            toast.error('备份创建失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 处理恢复备份
    const handleRestoreBackup = async (backupId: number) => {
        try {
            // TODO: 实现实际的备份恢复逻辑
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('备份恢复成功');
        } catch (error) {
            toast.error('备份恢复失败');
        }
    };

    // 处理删除备份
    const handleDeleteBackup = async (backupId: number) => {
        try {
            // TODO: 实现实际的备份删除逻辑
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('备份删除成功');
            refetch();
        } catch (error) {
            toast.error('备份删除失败');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">备份与恢复</h2>
                <div className="flex gap-2">
                    <Button
                        color="primary"
                        variant="shadow"
                        startContent={<Database size={16} />}
                        onPress={onOpen}
                    >
                        创建备份
                    </Button>
                    <Button
                        variant="flat"
                        startContent={<RefreshCcw size={16} />}
                        onPress={() => refetch()}
                    >
                        刷新
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="flex gap-3 px-6 py-4">
                    <Database size={24} className="text-primary" />
                    <div>
                        <h3 className="text-xl font-bold">备份管理</h3>
                        <p className="text-sm text-default-500">管理系统数据的备份和恢复</p>
                    </div>
                </CardHeader>
                <CardBody>
                    <Table aria-label="备份列表">
                        <TableHeader>
                            <TableColumn>备份名称</TableColumn>
                            <TableColumn>类型</TableColumn>
                            <TableColumn>大小</TableColumn>
                            <TableColumn>创建时间</TableColumn>
                            <TableColumn>状态</TableColumn>
                            <TableColumn>操作</TableColumn>
                        </TableHeader>
                        <TableBody
                            items={backups || []}
                            emptyContent={isLoading ? <Spinner label="加载中..." /> : "暂无备份数据"}
                        >
                            {(item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            color={item.type === '完整备份' ? 'primary' : 'secondary'}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {item.type}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{item.size}</TableCell>
                                    <TableCell>
                                        {new Date(item.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip color="success" variant="flat" size="sm">
                                            {item.status}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                startContent={<Download size={14} />}
                                                onPress={() => handleRestoreBackup(item.id)}
                                            >
                                                恢复
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                startContent={<Trash2 size={14} />}
                                                onPress={() => handleDeleteBackup(item.id)}
                                            >
                                                删除
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">创建新备份</ModalHeader>
                            <ModalBody>
                                <Input
                                    label="备份名称"
                                    placeholder="输入备份名称"
                                    value={backupName}
                                    onChange={(e) => setBackupName(e.target.value)}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    取消
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleCreateBackup}
                                    isLoading={isLoading}
                                >
                                    创建
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
} 