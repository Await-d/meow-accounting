'use client';

import React from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input
} from '@nextui-org/react';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { findUserByEmail } from '@/lib/api';
import type { FamilyMember } from '@/lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FamilyMembers() {
    const { currentFamily, members, loading, addMember, updateRole, removeMember, isAdmin } = useFamily();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [newMemberEmail, setNewMemberEmail] = React.useState('');
    const [selectedRole, setSelectedRole] = React.useState<'admin' | 'member'>('member');
    const [searchLoading, setSearchLoading] = React.useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [memberToDelete, setMemberToDelete] = React.useState<{ id: number; username: string } | null>(null);
    const [emailError, setEmailError] = React.useState('');

    const validateEmail = (email: string) => {
        if (!email || email.trim().length === 0) {
            return '邮箱不能为空';
        }
        if (!EMAIL_REGEX.test(email)) {
            return '邮箱格式不正确';
        }
        return '';
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewMemberEmail(value);
        setEmailError(validateEmail(value));
    };

    const handleAddMember = async () => {
        if (!currentFamily) return;

        const error = validateEmail(newMemberEmail);
        if (error) {
            setEmailError(error);
            return;
        }

        try {
            setSearchLoading(true);
            // 先通过邮箱查找用户
            const foundUser = await findUserByEmail(newMemberEmail);

            // 检查用户是否已经是成员
            if (members.some(member => member.user_id === foundUser.id)) {
                showToast('该用户已经是家庭成员', 'error');
                return;
            }

            // 添加成员
            await addMember(currentFamily.id, { userId: foundUser.id, role: selectedRole });
            onClose();
            setNewMemberEmail('');
            setSelectedRole('member');
            setEmailError('');
            showToast('成员添加成功', 'success');
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            } else {
                showToast('添加成员失败', 'error');
            }
        } finally {
            setSearchLoading(false);
        }
    };

    const handleUpdateRole = async (userId: number, newRole: 'admin' | 'member') => {
        if (!currentFamily) return;

        try {
            await updateRole(currentFamily.id, userId, newRole);
            showToast('角色更新成功', 'success');
        } catch (error) {
            showToast('更新角色失败', 'error');
        }
    };

    const handleRemoveMember = async () => {
        if (!currentFamily || !memberToDelete) return;

        try {
            await removeMember(currentFamily.id, memberToDelete.id);
            showToast('成员移除成功', 'success');
        } catch (error) {
            showToast('移除成员失败', 'error');
        } finally {
            setDeleteConfirmOpen(false);
            setMemberToDelete(null);
        }
    };

    const openDeleteConfirm = (userId: number, username: string) => {
        setMemberToDelete({ id: userId, username });
        setDeleteConfirmOpen(true);
    };

    const columns = React.useMemo(() => {
        const cols = [
            { key: 'username', label: '用户名' },
            { key: 'email', label: '邮箱' },
            { key: 'role', label: '角色' }
        ];
        if (isAdmin()) {
            cols.push({ key: 'actions', label: '操作' });
        }
        return cols;
    }, [isAdmin]);

    const renderCell = React.useCallback((member: FamilyMember, columnKey: React.Key) => {
        switch (columnKey.toString()) {
            case 'role':
                return member.role === 'owner' ? '所有者' : member.role === 'admin' ? '管理员' : '成员';
            case 'actions':
                if (isAdmin() && member.user_id !== user?.id && member.role !== 'owner') {
                    return (
                        <div className="flex gap-2">
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button size="sm" variant="bordered">
                                        更改角色
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="角色选择"
                                    onAction={(key) => {
                                        handleUpdateRole(member.user_id, key as 'admin' | 'member');
                                    }}
                                >
                                    <DropdownItem key="admin">管理员</DropdownItem>
                                    <DropdownItem key="member">成员</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <Button
                                size="sm"
                                color="danger"
                                variant="bordered"
                                onPress={() => openDeleteConfirm(member.user_id, member.username)}
                            >
                                移除
                            </Button>
                        </div>
                    );
                }
                return null;
            default:
                return member[columnKey.toString() as keyof FamilyMember];
        }
    }, [isAdmin, user?.id, handleUpdateRole]);

    if (!currentFamily) {
        return <div>请先选择或创建一个家庭</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">家庭成员</h2>
                {isAdmin() && (
                    <Button color="primary" onPress={onOpen}>
                        添加成员
                    </Button>
                )}
            </div>

            <Table aria-label="家庭成员列表">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.key}>
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={members}
                    isLoading={loading}
                    loadingContent={<div>加载中...</div>}
                >
                    {(member) => (
                        <TableRow key={member.id}>
                            {(columnKey) => (
                                <TableCell>
                                    {renderCell(member, columnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>添加成员</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Input
                                label="成员邮箱"
                                placeholder="请输入成员邮箱"
                                value={newMemberEmail}
                                onChange={handleEmailChange}
                                isInvalid={!!emailError}
                                errorMessage={emailError}
                                isRequired
                            />
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button variant="bordered">
                                        {selectedRole === 'admin' ? '管理员' : '成员'}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="角色选择"
                                    onAction={(key) => setSelectedRole(key as 'admin' | 'member')}
                                >
                                    <DropdownItem key="admin">管理员</DropdownItem>
                                    <DropdownItem key="member">成员</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={onClose}>
                            取消
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleAddMember}
                            isDisabled={!newMemberEmail || !!emailError}
                            isLoading={searchLoading}
                        >
                            添加
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <ModalContent>
                    <ModalHeader>确认移除成员</ModalHeader>
                    <ModalBody>
                        <p>确定要移除成员 {memberToDelete?.username} 吗？</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={() => setDeleteConfirmOpen(false)}>
                            取消
                        </Button>
                        <Button color="danger" onPress={handleRemoveMember}>
                            确认移除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 