'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useFamily, FamilyMember as FamilyMemberType, FamilyInvitation } from '@/hooks/useFamily';
import { fetchAPI } from '@/lib/api';
import { useQuery } from 'react-query';

interface FamilyMember {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'member' | 'owner';
    joined_at: string;
}

interface Invitation {
    id: number;
    email: string;
    role: 'admin' | 'member';
    status: 'pending' | 'accepted' | 'rejected';
    expires_at: string;
    created_at: string;
}

export default function FamilySettings() {
    const { user } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');
    const [isLoading, setIsLoading] = useState(false);
    const {
        currentFamily,
        useFamilyInvitations,
        useAddFamilyMember,
        useRemoveFamilyMember,
        useUpdateMemberRole,
        useDeleteInvitation
    } = useFamily();

    const { data: familyMembers } = useQuery(['familyMembers', currentFamily?.id],
        async () => {
            if (!currentFamily?.id) return [];
            const response = await fetchAPI<FamilyMemberType[]>(`/families/${currentFamily.id}/members`);
            return response.data;
        },
        { enabled: !!currentFamily?.id }
    );

    const { data: familyInvitations } = useFamilyInvitations(currentFamily?.id);
    const addMemberMutation = useAddFamilyMember();
    const removeMemberMutation = useRemoveFamilyMember();
    const updateRoleMutation = useUpdateMemberRole();
    const deleteInvitationMutation = useDeleteInvitation();

    // 加载家庭成员
    useEffect(() => {
        if (familyMembers) {
            setMembers(familyMembers.map((member: FamilyMemberType) => ({
                id: member.userId || member.id,
                username: member.name,
                email: member.email,
                role: member.role,
                joined_at: member.joinedAt || new Date().toISOString()
            })));
        }
    }, [familyMembers]);

    // 加载邀请记录
    useEffect(() => {
        if (familyInvitations) {
            setInvitations(familyInvitations.map((invitation: FamilyInvitation) => ({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                status: 'pending',
                expires_at: invitation.expiresAt,
                created_at: invitation.createdAt
            })));
        }
    }, [familyInvitations]);

    // 邀请新成员
    const handleInvite = async () => {
        if (!currentFamily?.id) {
            toast.error('未选择家庭');
            return;
        }

        if (!newMemberEmail) {
            toast.error('请输入邮箱地址');
            return;
        }

        setIsLoading(true);
        try {
            await addMemberMutation.mutateAsync({
                familyId: currentFamily.id,
                data: {
                    email: newMemberEmail,
                    role: newMemberRole
                }
            });

            toast.success('邀请已发送');
            setNewMemberEmail('');
            onClose();
        } catch (error) {
            toast.error('邀请发送失败');
            console.error('邀请发送失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 移除成员
    const handleRemoveMember = async (memberId: number) => {
        if (!currentFamily?.id) return;

        try {
            await removeMemberMutation.mutateAsync({
                familyId: currentFamily.id,
                memberId
            });
            setMembers(members.filter(member => member.id !== memberId));
            toast.success('成员已移除');
        } catch (error) {
            toast.error('移除成员失败');
            console.error('移除成员失败:', error);
        }
    };

    // 更新成员角色
    const handleUpdateRole = async (memberId: number, newRole: 'admin' | 'member') => {
        if (!currentFamily?.id) return;

        try {
            await updateRoleMutation.mutateAsync({
                familyId: currentFamily.id,
                memberId,
                role: newRole
            });

            setMembers(members.map(member =>
                member.id === memberId ? { ...member, role: newRole } : member
            ));
            toast.success('角色已更新');
        } catch (error) {
            toast.error('更新角色失败');
            console.error('更新角色失败:', error);
        }
    };

    // 取消邀请
    const handleCancelInvitation = async (invitationId: number) => {
        if (!currentFamily?.id) return;

        try {
            await deleteInvitationMutation.mutateAsync({
                familyId: currentFamily.id,
                invitationId
            });

            setInvitations(invitations.filter(inv => inv.id !== invitationId));
            toast.success('邀请已取消');
        } catch (error) {
            toast.error('取消邀请失败');
            console.error('取消邀请失败:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* 成员列表 */}
            <Card>
                <CardBody>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">家庭成员</h3>
                        <Button color="primary" onPress={onOpen}>
                            邀请成员
                        </Button>
                    </div>
                    <Table aria-label="家庭成员列表">
                        <TableHeader>
                            <TableColumn>用户名</TableColumn>
                            <TableColumn>邮箱</TableColumn>
                            <TableColumn>角色</TableColumn>
                            <TableColumn>加入时间</TableColumn>
                            <TableColumn>操作</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.username}</TableCell>
                                    <TableCell>{member.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            size="sm"
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value as 'admin' | 'member')}
                                        >
                                            <SelectItem key="admin" value="admin">管理员</SelectItem>
                                            <SelectItem key="member" value="member">成员</SelectItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="light"
                                            onPress={() => handleRemoveMember(member.id)}
                                        >
                                            移除
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* 邀请记录 */}
            <Card>
                <CardBody>
                    <h3 className="text-lg font-semibold mb-4">邀请记录</h3>
                    <Table aria-label="邀请记录列表">
                        <TableHeader>
                            <TableColumn>邮箱</TableColumn>
                            <TableColumn>角色</TableColumn>
                            <TableColumn>状态</TableColumn>
                            <TableColumn>过期时间</TableColumn>
                            <TableColumn>操作</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {invitations.map((invitation) => (
                                <TableRow key={invitation.id}>
                                    <TableCell>{invitation.email}</TableCell>
                                    <TableCell>{invitation.role === 'admin' ? '管理员' : '成员'}</TableCell>
                                    <TableCell>
                                        {invitation.status === 'pending' ? '等待接受' :
                                            invitation.status === 'accepted' ? '已接受' : '已拒绝'}
                                    </TableCell>
                                    <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {invitation.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                color="danger"
                                                variant="light"
                                                onPress={() => handleCancelInvitation(invitation.id)}
                                            >
                                                取消
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* 邀请成员模态框 */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>邀请新成员</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                label="邮箱地址"
                                placeholder="请输入邮箱地址"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                            />
                            <Select
                                label="选择角色"
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member')}
                            >
                                <SelectItem key="admin" value="admin">管理员</SelectItem>
                                <SelectItem key="member" value="member">成员</SelectItem>
                            </Select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            取消
                        </Button>
                        <Button color="primary" onPress={handleInvite} isLoading={isLoading}>
                            发送邀请
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 