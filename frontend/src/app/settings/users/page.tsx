'use client';

import React, { useState } from 'react';
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    SelectItem,
    Chip,
    Pagination,
    Spinner
} from '@nextui-org/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/lib/types';

// 这些API函数需要在lib/api.ts中实现
import { getAllUsers, updateUser, deleteUser, freezeUser, unfreezeUser } from '@/lib/api';

export default function UsersPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // 模态框状态
    const {
        isOpen: isEditModalOpen,
        onOpen: onOpenEditModal,
        onClose: onCloseEditModal
    } = useDisclosure();

    const {
        isOpen: isDeleteModalOpen,
        onOpen: onOpenDeleteModal,
        onClose: onCloseDeleteModal
    } = useDisclosure();

    const {
        isOpen: isLimitsModalOpen,
        onOpen: onOpenLimitsModal,
        onClose: onCloseLimitsModal
    } = useDisclosure();

    // 当前选中的用户
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: '',
        maxFamilies: 1,
        maxFamilyJoins: 2
    });

    // 获取所有用户
    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
        enabled: isAdmin
    });

    const users = (usersResponse as any)?.data || [];

    // 更新用户
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('用户更新成功');
            onCloseEditModal();
        },
        onError: (error) => {
            toast.error(`更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    // 删除用户
    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('用户删除成功');
            onCloseDeleteModal();
        },
        onError: (error) => {
            toast.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    // 冻结用户
    const freezeMutation = useMutation({
        mutationFn: freezeUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('用户已冻结');
        },
        onError: (error) => {
            toast.error(`冻结失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    // 解冻用户
    const unfreezeMutation = useMutation({
        mutationFn: unfreezeUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('用户已解冻');
        },
        onError: (error) => {
            toast.error(`解冻失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    // 处理编辑用户
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            role: user.role,
            maxFamilies: user.maxFamilies || 1,
            maxFamilyJoins: user.maxFamilyJoins || 2
        });
        onOpenEditModal();
    };

    // 处理删除用户
    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        onOpenDeleteModal();
    };

    // 处理冻结/解冻用户
    const handleToggleFreeze = (user: User) => {
        if (user.is_frozen) {
            unfreezeMutation.mutate(user.id);
        } else {
            freezeMutation.mutate(user.id);
        }
    };

    // 处理设置用户限制
    const handleSetLimits = (user: User) => {
        setSelectedUser(user);
        setFormData({
            ...formData,
            maxFamilies: user.maxFamilies || 1,
            maxFamilyJoins: user.maxFamilyJoins || 2
        });
        onOpenLimitsModal();
    };

    // 提交编辑表单
    const handleSubmitEdit = () => {
        if (!selectedUser) return;

        updateMutation.mutate({
            id: selectedUser.id,
            data: {
                username: formData.username,
                email: formData.email,
                role: formData.role as 'user' | 'admin' | 'owner'
            }
        });
    };

    // 提交删除确认
    const handleConfirmDelete = () => {
        if (!selectedUser) return;
        deleteMutation.mutate(selectedUser.id);
    };

    // 提交限制设置
    const handleSubmitLimits = () => {
        if (!selectedUser) return;

        updateMutation.mutate({
            id: selectedUser.id,
            data: {
                maxFamilies: formData.maxFamilies,
                maxFamilyJoins: formData.maxFamilyJoins
            }
        });

        onCloseLimitsModal();
    };

    // 分页处理
    const pages = Math.ceil((users?.length || 0) / rowsPerPage);
    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return users?.slice(start, end) || [];
    }, [page, users]);

    if (!isAdmin) {
        return (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">无权访问</h2>
                <p>只有管理员可以访问此页面</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">用户管理</h2>
            </div>

            <Card>
                <CardBody>
                    <Table
                        aria-label="用户列表"
                        bottomContent={
                            pages > 1 ? (
                                <div className="flex w-full justify-center">
                                    <Pagination
                                        isCompact
                                        showControls
                                        showShadow
                                        color="primary"
                                        page={page}
                                        total={pages}
                                        onChange={setPage}
                                    />
                                </div>
                            ) : null
                        }
                    >
                        <TableHeader>
                            <TableColumn>用户名</TableColumn>
                            <TableColumn>邮箱</TableColumn>
                            <TableColumn>角色</TableColumn>
                            <TableColumn>状态</TableColumn>
                            <TableColumn>家庭限制</TableColumn>
                            <TableColumn>操作</TableColumn>
                        </TableHeader>
                        <TableBody items={items} emptyContent="暂无用户数据">
                            {(item) => {
                                const user = item as User;
                                return (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            color={user.role === 'admin' ? 'primary' : user.role === 'owner' ? 'secondary' : 'default'}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {user.role === 'admin' ? '管理员' : user.role === 'owner' ? '所有者' : '普通用户'}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            color={user.is_frozen ? 'danger' : 'success'}
                                            variant="flat"
                                            size="sm"
                                        >
                                            {user.is_frozen ? '已冻结' : '正常'}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            <div>可创建: {user.maxFamilies || 1}个家庭</div>
                                            <div>可加入: {user.maxFamilyJoins || 2}个家庭</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="light"
                                                onPress={() => handleEditUser(user)}
                                            >
                                                编辑
                                            </Button>
                                            <Button
                                                size="sm"
                                                color={user.is_frozen ? 'success' : 'warning'}
                                                variant="light"
                                                onPress={() => handleToggleFreeze(user)}
                                            >
                                                {user.is_frozen ? '解冻' : '冻结'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="primary"
                                                variant="light"
                                                onPress={() => handleSetLimits(user)}
                                            >
                                                限制
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="light"
                                                onPress={() => handleDeleteUser(user)}
                                                isDisabled={user.role === 'owner'}
                                            >
                                                删除
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                            }}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* 编辑用户模态框 */}
            <Modal isOpen={isEditModalOpen} onClose={onCloseEditModal}>
                <ModalContent>
                    <ModalHeader>编辑用户</ModalHeader>
                    <ModalBody>
                        <Input
                            label="用户名"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                        <Input
                            label="邮箱"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Select
                            label="角色"
                            selectedKeys={[formData.role]}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            isDisabled={selectedUser?.role === 'owner'}
                        >
                            <SelectItem key="user" value="user">普通用户</SelectItem>
                            <SelectItem key="admin" value="admin">管理员</SelectItem>
                            <SelectItem key="owner" value="owner">所有者</SelectItem>
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onCloseEditModal}>
                            取消
                        </Button>
                        <Button color="primary" onPress={handleSubmitEdit}>
                            保存
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 删除用户确认模态框 */}
            <Modal isOpen={isDeleteModalOpen} onClose={onCloseDeleteModal}>
                <ModalContent>
                    <ModalHeader>确认删除</ModalHeader>
                    <ModalBody>
                        <p>确定要删除用户 "{selectedUser?.username}" 吗？此操作不可撤销。</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onCloseDeleteModal}>
                            取消
                        </Button>
                        <Button color="danger" onPress={handleConfirmDelete}>
                            删除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 设置用户限制模态框 */}
            <Modal isOpen={isLimitsModalOpen} onClose={onCloseLimitsModal}>
                <ModalContent>
                    <ModalHeader>设置用户限制</ModalHeader>
                    <ModalBody>
                        <Input
                            type="number"
                            label="最大可创建家庭数"
                            value={formData.maxFamilies.toString()}
                            onChange={(e) => setFormData({ ...formData, maxFamilies: parseInt(e.target.value) || 1 })}
                            min={1}
                            max={10}
                        />
                        <Input
                            type="number"
                            label="最大可加入家庭数"
                            value={formData.maxFamilyJoins.toString()}
                            onChange={(e) => setFormData({ ...formData, maxFamilyJoins: parseInt(e.target.value) || 2 })}
                            min={1}
                            max={10}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onCloseLimitsModal}>
                            取消
                        </Button>
                        <Button color="primary" onPress={handleSubmitLimits}>
                            保存
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 