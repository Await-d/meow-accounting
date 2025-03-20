'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    CardBody,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Chip,
    Select,
    SelectItem,
    Tabs,
    Tab,
    Switch,
    Divider,
    Skeleton,
} from '@nextui-org/react';
import { PlusIcon, PencilIcon, TrashIcon, UserPlusIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Save as SaveIcon } from 'lucide-react';
import {
    useFamily,
    useCreateFamily,
    useUpdateFamily,
    useDeleteFamily,
    useAddFamilyMember,
    useUpdateMemberRole,
    useRemoveFamilyMember,
    useDeleteInvitation,
    useFamilyInvitations,
    Family,
    FamilyMember,
    FamilyInvitation
} from '@/hooks/useFamily';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import { useFamilySettings, FamilySettings } from '@/hooks/useFamilySettings';
import { useRoles, Role, Permission } from '@/hooks/useRoles';
import RoleEditModal from '@/components/RoleEditModal';
import InvitationList from '@/components/InvitationList';

export default function FamilyPage() {
    const { families, members, isLoading, currentFamily, setCurrentFamily } = useFamily();
    const { data: familyInvitations, isLoading: isLoadingInvitations } = useFamilyInvitations(currentFamily?.id);
    const { data: userInvitations, isLoading: isLoadingUserInvitations, refetch: refetchUserInvitations } = useFamily().userInvitations;
    const { mutate: createFamily } = useCreateFamily();
    const { mutate: updateFamily } = useUpdateFamily();
    const { mutate: deleteFamily } = useDeleteFamily();
    const { mutate: addMember, data: inviteData } = useAddFamilyMember();
    const { mutate: updateMemberRole } = useUpdateMemberRole();
    const { mutate: removeMember } = useRemoveFamilyMember();
    const { mutate: deleteInvitation } = useDeleteInvitation();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();
    const { isOpen: isMemberOpen, onOpen: onOpenMember, onClose: onCloseMember } = useDisclosure();
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const { settings: familySettings, isLoading: isLoadingSettings, updateSettings } = useFamilySettings(currentFamily?.id);
    const [settingsForm, setSettingsForm] = useState<FamilySettings>({
        defaultSharedBooks: false,
        expenseLimitAlert: false,
        newMemberNotification: true,
        largeExpenseNotification: true,
        budgetOverspendingNotification: true
    });
    const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
    const [formData, setFormData] = useState<Partial<Family>>({
        name: '',
        description: '',
    });
    const [memberData, setMemberData] = useState({
        email: '',
        role: 'member' as 'admin' | 'member',
        isGeneric: false,
        expiresInHours: 48,
        maxUses: 1
    });
    const { showToast } = useToast();
    const { user } = useAuth();
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("members");
    const [mainTab, setMainTab] = useState<string>("families");
    const queryClient = useQueryClient();
    const { roles, permissions, isLoading: isLoadingRoles, createRole, updateRole, deleteRole } = useRoles(currentFamily?.id);
    const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
    const { isOpen: isRoleModalOpen, onOpen: onOpenRoleModal, onClose: onCloseRoleModal } = useDisclosure();

    // 判断当前用户是否是管理员
    const isAdmin = useMemo(() => {
        if (!currentFamily || !user) return false;

        // 如果是创建者，肯定是管理员
        if (currentFamily.owner_id === user.id) return true;

        // 检查成员列表中的角色
        const currentMember = members?.find(m => m.user_id === user.id);
        return currentMember?.role === 'admin' || currentMember?.role === 'owner';
    }, [currentFamily, user, members]);

    // 在组件加载时刷新用户邀请
    useEffect(() => {
        console.log('刷新用户邀请');
        refetchUserInvitations().catch(error => {
            console.error('刷新用户邀请失败:', error);
            showToast('获取邀请失败', 'error');
        });
    }, [refetchUserInvitations, showToast]);

    // 打印收到的邀请数据，用于调试
    useEffect(() => {
        console.log('收到的邀请数据:', userInvitations);
    }, [userInvitations]);

    // 当获取到设置时更新表单
    useEffect(() => {
        if (familySettings) {
            setSettingsForm(familySettings);
        }
    }, [familySettings]);

    // 处理设置变更
    const handleSettingChange = (key: keyof FamilySettings, value: boolean) => {
        setSettingsForm(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 保存设置
    const handleSaveSettings = () => {
        if (!currentFamily) return;
        updateSettings(settingsForm);
    };

    const handleSubmit = () => {
        if (!formData.name) {
            showToast('请填写家庭名称', 'error');
            return;
        }

        if (selectedFamily) {
            updateFamily({
                ...selectedFamily,
                ...formData,
            });
        } else {
            createFamily(formData as { name: string; description: string });
        }

        onClose();
        setSelectedFamily(null);
        setFormData({ name: '', description: '' });
    };

    const handleDelete = (family: Family) => {
        setSelectedFamily(family);
        onOpenDelete();
    };

    const handleDeleteConfirm = () => {
        if (selectedFamily) {
            deleteFamily(selectedFamily.id);
        }
        onCloseDelete();
        setSelectedFamily(null);
    };

    const handleAddMember = () => {
        if (!currentFamily) return;

        // 如果是通用邀请，不需要邮箱
        if (!memberData.isGeneric && !memberData.email) {
            showToast('请输入邮箱', 'error');
            return;
        }

        addMember({
            familyId: currentFamily.id,
            email: memberData.email,
            role: memberData.role,
            isGeneric: memberData.isGeneric,
            expiresInHours: memberData.expiresInHours,
            maxUses: memberData.maxUses
        }, {
            onSuccess: (data) => {
                // 显示邀请链接
                if (data && data.inviteLink) {
                    setInviteLink(data.inviteLink);
                } else {
                    onCloseMember();
                    setMemberData({
                        email: '',
                        role: 'member',
                        isGeneric: false,
                        expiresInHours: 48,
                        maxUses: 1
                    });
                }
            }
        });
    };

    const handleCopyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
                .then(() => {
                    showToast('邀请链接已复制到剪贴板', 'success');
                })
                .catch(() => {
                    showToast('复制失败，请手动复制', 'error');
                });
        }
    };

    const handleRoleChange = async (memberId: number, newRole: 'admin' | 'member') => {
        if (!currentFamily) return;
        updateMemberRole({ familyId: currentFamily.id, memberId, role: newRole });
    };

    const handleRemoveMember = (member: FamilyMember) => {
        if (!currentFamily) return;
        console.log('准备移除成员:', member);
        setSelectedMember(member);
        onOpenDelete();
    };

    // 添加退出家庭和解散家庭的函数
    const handleLeaveFamily = () => {
        if (!currentFamily || !user) return;

        // 确认是否要退出家庭
        if (confirm(`确定要退出 ${currentFamily.name} 家庭吗？退出后将无法访问该家庭的数据。`)) {
            // 如果是创建者，提示不能退出
            if (currentFamily.owner_id === user.id) {
                showToast('您是家庭创建者，不能退出家庭。如需解散家庭，请使用解散功能。', 'error');
                return;
            }

            // 调用API退出家庭
            removeMember({
                familyId: currentFamily.id,
                memberId: user.id
            });
        }
    };

    const handleDisbandFamily = () => {
        if (!currentFamily || !user) return;

        // 确认是否要解散家庭
        if (confirm(`确定要解散 ${currentFamily.name} 家庭吗？解散后所有数据将被删除，此操作不可撤销。`)) {
            // 检查是否是创建者
            if (currentFamily.owner_id !== user.id) {
                showToast('只有家庭创建者才能解散家庭', 'error');
                return;
            }

            // 调用API解散家庭
            deleteFamily(currentFamily.id);
        }
    };

    // 处理删除邀请
    const handleDeleteInvitation = (invitationId: number) => {
        if (!currentFamily) return;
        deleteInvitation({
            familyId: currentFamily.id,
            invitationId
        });
    };

    // 处理接受邀请
    const handleAcceptInvitation = async (token: string) => {
        try {
            // 使用fetchAPI函数发送请求到后端API
            await fetchAPI(`/families/invitations/${token}/accept`, {
                method: 'POST',
            });

            showToast('已成功加入家庭', 'success');
            // 刷新数据
            refetchUserInvitations();
            queryClient.invalidateQueries({ queryKey: ['families'] });
        } catch (error) {
            console.error('接受邀请失败:', error);
            showToast('接受邀请失败', 'error');
        }
    };

    // 处理拒绝邀请
    const handleRejectInvitation = async (token: string) => {
        try {
            // 使用fetchAPI函数发送请求到后端API
            await fetchAPI(`/families/invitations/${token}/reject`, {
                method: 'POST',
            });

            showToast('已拒绝邀请', 'success');
            // 刷新数据
            refetchUserInvitations();
        } catch (error) {
            console.error('拒绝邀请失败:', error);
            showToast('拒绝邀请失败', 'error');
        }
    };

    // 处理角色相关操作
    const handleCreateRole = () => {
        setSelectedRole(undefined);
        onOpenRoleModal();
    };

    const handleEditRole = (role: Role) => {
        setSelectedRole(role);
        onOpenRoleModal();
    };

    const handleDeleteRole = (role: Role) => {
        if (confirm(`确定要删除角色 "${role.name}" 吗？`)) {
            deleteRole(role.id);
        }
    };

    const handleRoleSubmit = (data: { name: string; description: string; permissions: string[] }) => {
        if (selectedRole) {
            updateRole({
                roleId: selectedRole.id,
                data: {
                    name: data.name,
                    description: data.description,
                    permissions: data.permissions.map(code => ({
                        id: 0, // 这个ID会被后端忽略
                        code,
                        name: permissions?.find(p => p.code === code)?.name || '',
                        description: permissions?.find(p => p.code === code)?.description || ''
                    }))
                }
            });
        } else {
            createRole(data);
        }
        onCloseRoleModal();
    };

    // 修复 Skeleton 组件的使用
    const renderLoadingSkeleton = () => (
        <div className="space-y-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
        </div>
    );

    if (isLoading) {
        return <Skeleton type="table" />;
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <Tabs
                aria-label="主选项卡"
                selectedKey={mainTab}
                onSelectionChange={(key) => setMainTab(key as string)}
                className="mb-4"
            >
                <Tab key="families" title="家庭管理">
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardBody className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">我的家庭</h2>
                                    <p className="text-sm text-default-500 mt-1">
                                        管理您的家庭信息和成员
                                    </p>
                                </div>
                                <Button
                                    color="primary"
                                    startContent={<PlusIcon className="h-5 w-5" />}
                                    onPress={() => {
                                        setSelectedFamily(null);
                                        setFormData({ name: '', description: '' });
                                        onOpen();
                                    }}
                                    size="md"
                                    className="min-w-[140px]"
                                >
                                    创建家庭
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <Table
                                    aria-label="家庭列表"
                                    classNames={{
                                        base: "min-w-full",
                                        table: "min-w-full",
                                        thead: "bg-default-50",
                                        th: "text-default-700 font-semibold",
                                        tr: "hover:bg-default-50 transition-colors border-b border-default-100",
                                    }}
                                >
                                    <TableHeader>
                                        <TableColumn className="text-sm">名称</TableColumn>
                                        <TableColumn className="text-sm">描述</TableColumn>
                                        <TableColumn className="text-sm">成员数</TableColumn>
                                        <TableColumn className="text-sm">状态</TableColumn>
                                        <TableColumn className="text-sm">操作</TableColumn>
                                    </TableHeader>
                                    <TableBody items={families || []} emptyContent="暂无家庭，点击右上角创建">
                                        {(family) => (
                                            <TableRow key={family.id} className="h-14">
                                                <TableCell>
                                                    <div className="font-medium">{family.name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-default-500">{family.description || '无描述'}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip color="primary" variant="flat" size="sm">
                                                        {family.member_count || 0} 人
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        color={currentFamily?.id === family.id ? 'success' : 'default'}
                                                        variant="flat"
                                                        size="sm"
                                                        className="capitalize"
                                                    >
                                                        {currentFamily?.id === family.id ? '当前' : '未选择'}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="primary"
                                                            onPress={() => setCurrentFamily(family)}
                                                            isDisabled={currentFamily?.id === family.id}
                                                            className="min-w-[80px]"
                                                        >
                                                            {currentFamily?.id === family.id ? '已选择' : '切换'}
                                                        </Button>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            color="primary"
                                                            onPress={() => {
                                                                setSelectedFamily(family);
                                                                setFormData(family);
                                                                onOpen();
                                                            }}
                                                            className="rounded-full"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            color="danger"
                                                            variant="light"
                                                            onPress={() => handleDelete(family)}
                                                            isDisabled={family.owner_id !== user?.id}
                                                            className="rounded-full"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>

                    {currentFamily && (
                        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 mt-8">
                            <CardBody className="p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">{currentFamily.name}</h2>
                                        <p className="text-sm text-default-500 mt-1">
                                            {currentFamily.description || '暂无描述'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            startContent={<PencilIcon className="h-4 w-4" />}
                                            onPress={() => {
                                                setSelectedFamily(currentFamily);
                                                setFormData({
                                                    name: currentFamily.name,
                                                    description: currentFamily.description,
                                                });
                                                onOpen();
                                            }}
                                            size="sm"
                                        >
                                            编辑
                                        </Button>
                                        {/* 添加退出家庭按钮 */}
                                        {currentFamily.owner_id !== user?.id && (
                                            <Button
                                                color="default"
                                                variant="flat"
                                                onPress={handleLeaveFamily}
                                                size="sm"
                                            >
                                                退出家庭
                                            </Button>
                                        )}
                                        {/* 添加解散家庭按钮 */}
                                        {currentFamily.owner_id === user?.id && (
                                            <Button
                                                color="danger"
                                                variant="flat"
                                                onPress={handleDisbandFamily}
                                                size="sm"
                                            >
                                                解散家庭
                                            </Button>
                                        )}
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            startContent={<TrashIcon className="h-4 w-4" />}
                                            onPress={() => handleDelete(currentFamily)}
                                            size="sm"
                                            isDisabled={currentFamily.owner_id !== user?.id}
                                        >
                                            删除
                                        </Button>
                                        <Button
                                            color="primary"
                                            startContent={<UserPlusIcon className="h-4 w-4" />}
                                            onPress={() => {
                                                setInviteLink(null);
                                                setMemberData({
                                                    email: '',
                                                    role: 'member',
                                                    isGeneric: false,
                                                    expiresInHours: 48,
                                                    maxUses: 1
                                                });
                                                onOpenMember();
                                            }}
                                            size="sm"
                                            isDisabled={!isAdmin}
                                        >
                                            添加成员
                                        </Button>
                                    </div>
                                </div>

                                <Tabs
                                    aria-label="家庭管理选项"
                                    selectedKey={activeTab}
                                    onSelectionChange={(key) => setActiveTab(key as string)}
                                >
                                    <Tab key="members" title="成员管理">
                                        <div className="overflow-x-auto mt-4">
                                            <Table
                                                aria-label="成员列表"
                                                classNames={{
                                                    base: "min-w-full",
                                                    table: "min-w-full",
                                                    thead: "bg-default-50",
                                                    th: "text-default-700 font-semibold",
                                                    tr: "hover:bg-default-50 transition-colors border-b border-default-100",
                                                }}
                                            >
                                                <TableHeader>
                                                    <TableColumn className="text-sm">用户名</TableColumn>
                                                    <TableColumn className="text-sm">邮箱</TableColumn>
                                                    <TableColumn className="text-sm">角色</TableColumn>
                                                    <TableColumn className="text-sm">操作</TableColumn>
                                                </TableHeader>
                                                <TableBody items={members || []} emptyContent="暂无成员，点击右上角添加">
                                                    {(member) => (
                                                        <TableRow key={member.id} className="h-14">
                                                            <TableCell>
                                                                <div className="font-medium">{member.username}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-default-500">{member.email}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {member.role === 'owner' ? (
                                                                    <Chip color="warning" variant="flat" size="sm">创建者</Chip>
                                                                ) : member.role === 'admin' ? (
                                                                    <Chip color="primary" variant="flat" size="sm">管理员</Chip>
                                                                ) : (
                                                                    <Chip color="default" variant="flat" size="sm">成员</Chip>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {member.role !== 'owner' && currentFamily?.owner_id === user?.id && (
                                                                        <Select
                                                                            aria-label="修改角色"
                                                                            selectedKeys={[member.role]}
                                                                            onChange={(e) =>
                                                                                handleRoleChange(
                                                                                    member.id,
                                                                                    e.target.value as 'admin' | 'member'
                                                                                )
                                                                            }
                                                                            size="sm"
                                                                            className="max-w-[120px]"
                                                                        >
                                                                            <SelectItem key="admin" value="admin">
                                                                                管理员
                                                                            </SelectItem>
                                                                            <SelectItem key="member" value="member">
                                                                                成员
                                                                            </SelectItem>
                                                                        </Select>
                                                                    )}
                                                                    <Button
                                                                        isIconOnly
                                                                        size="sm"
                                                                        color="danger"
                                                                        variant="light"
                                                                        onPress={() => handleRemoveMember(member)}
                                                                        isDisabled={
                                                                            member.role === 'owner' ||
                                                                            currentFamily?.owner_id !== user?.id
                                                                        }
                                                                        className="rounded-full"
                                                                    >
                                                                        <TrashIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Tab>
                                    <Tab key="invitations" title="邀请管理">
                                        <div className="mt-4">
                                            {isLoadingInvitations ? (
                                                <Skeleton className="h-64" />
                                            ) : (
                                                <InvitationList
                                                    invitations={familyInvitations || []}
                                                    type="sent"
                                                    onDelete={isAdmin ? handleDeleteInvitation : undefined}
                                                />
                                            )}
                                        </div>
                                    </Tab>
                                    <Tab key="roles" title="角色权限">
                                        <div className="mt-4">
                                            <Card>
                                                <CardBody>
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h3 className="text-lg font-semibold">角色权限设置</h3>
                                                                <p className="text-sm text-default-500">管理家庭成员的角色和权限</p>
                                                            </div>
                                                            {isAdmin && (
                                                                <Button
                                                                    color="primary"
                                                                    size="sm"
                                                                    startContent={<PlusIcon className="h-4 w-4" />}
                                                                    onPress={handleCreateRole}
                                                                >
                                                                    添加角色
                                                                </Button>
                                                            )}
                                                        </div>

                                                        {isLoadingRoles ? renderLoadingSkeleton() : (
                                                            <div className="space-y-4">
                                                                {roles?.map((role) => (
                                                                    <div key={role.id} className="border rounded-lg p-4">
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div>
                                                                                <h4 className="font-medium">{role.name}</h4>
                                                                                <p className="text-sm text-default-500">{role.description}</p>
                                                                            </div>
                                                                            {isAdmin && !role.isSystem && (
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        isIconOnly
                                                                                        size="sm"
                                                                                        variant="light"
                                                                                        color="primary"
                                                                                        onPress={() => handleEditRole(role)}
                                                                                        className="rounded-full"
                                                                                    >
                                                                                        <PencilIcon className="h-4 w-4" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        isIconOnly
                                                                                        size="sm"
                                                                                        variant="light"
                                                                                        color="danger"
                                                                                        onPress={() => handleDeleteRole(role)}
                                                                                        className="rounded-full"
                                                                                    >
                                                                                        <TrashIcon className="h-4 w-4" />
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                            {role.permissions.map((permission) => (
                                                                                <Chip
                                                                                    key={permission.code}
                                                                                    color={role.isSystem ? "warning" : "primary"}
                                                                                    variant="flat"
                                                                                    size="sm"
                                                                                >
                                                                                    {permission.name}
                                                                                </Chip>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </Tab>
                                    <Tab key="settings" title="家庭设置">
                                        <div className="mt-4">
                                            <Card>
                                                <CardBody>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h3 className="text-lg font-semibold">基本设置</h3>
                                                            <div className="mt-4 space-y-4">
                                                                <Input
                                                                    label="家庭名称"
                                                                    value={formData.name}
                                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                                    variant="bordered"
                                                                    isDisabled={!isAdmin}
                                                                />
                                                                <Input
                                                                    label="家庭描述"
                                                                    value={formData.description}
                                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                                    variant="bordered"
                                                                    isDisabled={!isAdmin}
                                                                />
                                                            </div>
                                                        </div>

                                                        <Divider />

                                                        <div>
                                                            <h3 className="text-lg font-semibold">账本设置</h3>
                                                            <div className="mt-4 space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-medium">默认共享账本</p>
                                                                        <p className="text-sm text-default-500">新成员加入时自动共享的账本</p>
                                                                    </div>
                                                                    <Switch
                                                                        isSelected={settingsForm.defaultSharedBooks}
                                                                        onValueChange={(value) => handleSettingChange('defaultSharedBooks', value)}
                                                                        isDisabled={!isAdmin}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-medium">支出限额提醒</p>
                                                                        <p className="text-sm text-default-500">成员超出支出限额时发送提醒</p>
                                                                    </div>
                                                                    <Switch
                                                                        isSelected={settingsForm.expenseLimitAlert}
                                                                        onValueChange={(value) => handleSettingChange('expenseLimitAlert', value)}
                                                                        isDisabled={!isAdmin}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Divider />

                                                        <div>
                                                            <h3 className="text-lg font-semibold">通知设置</h3>
                                                            <div className="mt-4 space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-medium">新成员加入通知</p>
                                                                        <p className="text-sm text-default-500">有新成员加入时通知所有成员</p>
                                                                    </div>
                                                                    <Switch
                                                                        isSelected={settingsForm.newMemberNotification}
                                                                        onValueChange={(value) => handleSettingChange('newMemberNotification', value)}
                                                                        isDisabled={!isAdmin}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-medium">大额支出通知</p>
                                                                        <p className="text-sm text-default-500">发生大额支出时通知管理员</p>
                                                                    </div>
                                                                    <Switch
                                                                        isSelected={settingsForm.largeExpenseNotification}
                                                                        onValueChange={(value) => handleSettingChange('largeExpenseNotification', value)}
                                                                        isDisabled={!isAdmin}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-medium">预算超支通知</p>
                                                                        <p className="text-sm text-default-500">预算超支时通知相关成员</p>
                                                                    </div>
                                                                    <Switch
                                                                        isSelected={settingsForm.budgetOverspendingNotification}
                                                                        onValueChange={(value) => handleSettingChange('budgetOverspendingNotification', value)}
                                                                        isDisabled={!isAdmin}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isAdmin && (
                                                            <>
                                                                <Divider />
                                                                <div className="flex justify-end">
                                                                    <Button
                                                                        color="primary"
                                                                        startContent={<SaveIcon className="h-4 w-4" />}
                                                                        onPress={handleSaveSettings}
                                                                        isLoading={isLoadingSettings}
                                                                    >
                                                                        保存设置
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    </Tab>
                                </Tabs>
                            </CardBody>
                        </Card>
                    )}
                </Tab>
                <Tab key="invitations" title="我的邀请">
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardBody className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">我的邀请</h2>
                                    <p className="text-sm text-default-500 mt-1">
                                        查看所有收到的和发出的邀请
                                    </p>
                                </div>
                            </div>

                            <Tabs>
                                <Tab key="received" title="收到的邀请">
                                    <div className="mt-4">
                                        {isLoadingUserInvitations ? (
                                            <Skeleton className="h-64" />
                                        ) : userInvitations && userInvitations.length > 0 ? (
                                            <>
                                                <div className="mb-4">
                                                    <p className="text-sm text-default-500">
                                                        您有 {userInvitations.length} 个待处理的邀请，请选择接受或拒绝
                                                    </p>
                                                </div>
                                                <Card className="shadow-sm">
                                                    <CardBody>
                                                        <InvitationList
                                                            invitations={userInvitations}
                                                            type="received"
                                                            onAccept={handleAcceptInvitation}
                                                            onReject={handleRejectInvitation}
                                                        />
                                                    </CardBody>
                                                </Card>
                                            </>
                                        ) : (
                                            <Card>
                                                <CardBody className="py-8 text-center">
                                                    <div className="text-default-400 mb-2">
                                                        <EnvelopeIcon className="h-12 w-12 mx-auto" />
                                                    </div>
                                                    <p className="text-default-600">
                                                        暂无收到的邀请
                                                    </p>
                                                    <Button
                                                        color="primary"
                                                        variant="light"
                                                        size="sm"
                                                        className="mt-4"
                                                        onPress={() => refetchUserInvitations()}
                                                    >
                                                        刷新
                                                    </Button>
                                                </CardBody>
                                            </Card>
                                        )}
                                    </div>
                                </Tab>
                                <Tab key="sent" title="发出的邀请">
                                    <div className="mt-4">
                                        <Card>
                                            <CardBody className="py-4">
                                                <p className="text-default-600 mb-4">选择一个家庭查看已发送的邀请：</p>
                                                <Select
                                                    label="选择家庭"
                                                    placeholder="请选择家庭"
                                                    className="max-w-xs mb-4"
                                                    onChange={(e) => {
                                                        const familyId = parseInt(e.target.value);
                                                        const family = families?.find(f => f.id === familyId);
                                                        if (family) {
                                                            setCurrentFamily(family);
                                                            setMainTab("families");
                                                            setActiveTab("invitations");
                                                        }
                                                    }}
                                                >
                                                    {(families || []).map((family) => (
                                                        <SelectItem key={family.id} value={family.id}>
                                                            {family.name}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>

            {/* 编辑/创建家庭模态框 */}
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                classNames={{
                    base: "max-w-md mx-auto",
                    header: "border-b border-default-100 pb-2",
                    body: "py-6",
                    footer: "border-t border-default-100 pt-2"
                }}
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold">{selectedFamily ? '编辑家庭' : '创建家庭'}</h3>
                        <p className="text-sm text-default-500">
                            {selectedFamily ? '修改家庭信息' : '创建新的家庭'}
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
                            <Input
                                label="名称"
                                placeholder="请输入家庭名称"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                variant="bordered"
                                labelPlacement="outside"
                                isRequired
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-sm">名称</span>
                                    </div>
                                }
                            />
                            <Input
                                label="描述"
                                placeholder="请输入家庭描述"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                variant="bordered"
                                labelPlacement="outside"
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-sm">描述</span>
                                    </div>
                                }
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="bordered"
                            onPress={onClose}
                            className="min-w-[80px]"
                        >
                            取消
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleSubmit}
                            className="min-w-[80px]"
                        >
                            确定
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 添加成员模态框 */}
            <Modal
                isOpen={isMemberOpen}
                onClose={onCloseMember}
                classNames={{
                    base: "max-w-md mx-auto",
                    header: "border-b border-default-100 pb-2",
                    body: "py-6",
                    footer: "border-t border-default-100 pt-2"
                }}
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold">添加成员</h3>
                        <p className="text-sm text-default-500">
                            {memberData.isGeneric ? '创建通用邀请链接' : '发送邀请给指定用户'}
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        {!inviteLink ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        isSelected={memberData.isGeneric}
                                        onValueChange={(value) => setMemberData({ ...memberData, isGeneric: value })}
                                    />
                                    <span>创建通用邀请链接（无需指定邮箱）</span>
                                </div>

                                {!memberData.isGeneric && (
                                    <Input
                                        label="邮箱"
                                        placeholder="请输入邮箱"
                                        value={memberData.email}
                                        onValueChange={(value) => setMemberData({ ...memberData, email: value })}
                                    />
                                )}

                                <Select
                                    label="角色"
                                    selectedKeys={[memberData.role]}
                                    onChange={(e) => setMemberData({ ...memberData, role: e.target.value as 'admin' | 'member' })}
                                >
                                    <SelectItem key="member" value="member">成员</SelectItem>
                                    <SelectItem key="admin" value="admin">管理员</SelectItem>
                                </Select>

                                <Input
                                    type="number"
                                    label="有效期（小时）"
                                    placeholder="请输入有效期"
                                    value={memberData.expiresInHours.toString()}
                                    onValueChange={(value) => setMemberData({ ...memberData, expiresInHours: parseInt(value) || 48 })}
                                />

                                {memberData.isGeneric && (
                                    <Input
                                        type="number"
                                        label="最大使用次数"
                                        placeholder="请输入最大使用次数"
                                        value={memberData.maxUses.toString()}
                                        onValueChange={(value) => setMemberData({ ...memberData, maxUses: parseInt(value) || 1 })}
                                        description="设置为1表示只能使用一次，设置更大的值可以多次使用"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-success-50 p-4 rounded-lg text-center">
                                    <div className="text-success text-xl mb-2">✓</div>
                                    <p className="font-medium">邀请已创建</p>
                                    <p className="text-sm text-default-500 mt-1">
                                        {memberData.isGeneric
                                            ? '请将以下链接分享给需要加入的成员'
                                            : `请将以下链接发送给 ${memberData.email}`}
                                    </p>
                                </div>

                                <div className="border border-default-200 rounded-lg p-3 bg-default-50">
                                    <p className="text-sm break-all">{inviteLink}</p>
                                </div>

                                <p className="text-sm text-default-500">
                                    邀请链接有效期为{memberData.expiresInHours}小时
                                    {memberData.isGeneric ? `，最多可被使用${memberData.maxUses}次` : ''}。
                                    {!memberData.isGeneric && '对方需要登录后才能接受邀请。'}
                                </p>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        {!inviteLink ? (
                            <>
                                <Button color="danger" variant="light" onPress={onCloseMember}>
                                    取消
                                </Button>
                                <Button color="primary" onPress={handleAddMember}>
                                    创建邀请
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button color="primary" variant="light" onPress={() => {
                                    navigator.clipboard.writeText(inviteLink);
                                    showToast('邀请链接已复制到剪贴板', 'success');
                                }}>
                                    复制链接
                                </Button>
                                <Button color="primary" onPress={() => {
                                    setInviteLink(null);
                                    onCloseMember();
                                    setMemberData({
                                        email: '',
                                        role: 'member',
                                        isGeneric: false,
                                        expiresInHours: 48,
                                        maxUses: 1
                                    });
                                }}>
                                    完成
                                </Button>
                            </>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 删除确认框 */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={onCloseDelete}
                classNames={{
                    base: "max-w-md mx-auto",
                    header: "border-b border-default-100 pb-2",
                    body: "py-6",
                    footer: "border-t border-default-100 pt-2"
                }}
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold">确认删除</h3>
                        <p className="text-sm text-default-500">
                            此操作不可撤销
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex items-center justify-center py-4">
                            <div className="bg-danger-50 p-4 rounded-full mb-4">
                                <TrashIcon className="h-8 w-8 text-danger" />
                            </div>
                        </div>
                        <p className="text-center">
                            {selectedFamily ? (
                                <>确定要删除 <span className="font-bold">{selectedFamily.name}</span> 家庭吗？</>
                            ) : (
                                <>确定要移除 <span className="font-bold">{selectedMember?.username}</span> 成员吗？</>
                            )}
                        </p>
                        <p className="text-center text-default-500 text-sm mt-2">
                            {selectedFamily
                                ? '删除后所有相关数据将无法恢复。'
                                : '移除后该成员将无法访问此家庭的数据。'}
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="bordered"
                            onPress={onCloseDelete}
                            className="min-w-[80px]"
                        >
                            取消
                        </Button>
                        <Button
                            color="danger"
                            onPress={selectedFamily ? handleDeleteConfirm : () => {
                                if (selectedMember && currentFamily) {
                                    console.log('确认移除成员:', selectedMember, '家庭ID:', currentFamily.id);
                                    removeMember({
                                        familyId: currentFamily.id,
                                        memberId: selectedMember.user_id // 使用user_id而不是id
                                    });
                                    onCloseDelete();
                                    setSelectedMember(null);
                                }
                            }}
                            className="min-w-[80px]"
                        >
                            删除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 添加角色编辑模态框 */}
            <RoleEditModal
                isOpen={isRoleModalOpen}
                onClose={onCloseRoleModal}
                onSubmit={handleRoleSubmit}
                role={selectedRole}
                permissions={permissions}
                isLoading={isLoadingRoles}
            />
        </div>
    );
} 