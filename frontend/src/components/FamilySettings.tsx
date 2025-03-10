'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FamilyMember {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'member';
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

    // 加载家庭成员
    useEffect(() => {
        // TODO: 从API加载家庭成员
        const mockMembers: FamilyMember[] = [
            {
                id: 1,
                username: '张三',
                email: 'zhangsan@example.com',
                role: 'admin',
                joined_at: new Date().toISOString()
            }
        ];
        setMembers(mockMembers);
    }, []);

    // 加载邀请记录
    useEffect(() => {
        // TODO: 从API加载邀请记录
        const mockInvitations: Invitation[] = [
            {
                id: 1,
                email: 'lisi@example.com',
                role: 'member',
                status: 'pending',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString()
            }
        ];
        setInvitations(mockInvitations);
    }, []);

    // 邀请新成员
    const handleInvite = async () => {
        if (!newMemberEmail) {
            toast.error('请输入邮箱地址');
            return;
        }

        setIsLoading(true);
        try {
            // TODO: 调用API发送邀请
            // await inviteMember({ email: newMemberEmail, role: newMemberRole });
            toast.success('邀请已发送');
            setNewMemberEmail('');
            onClose();
        } catch (error) {
            toast.error('邀请发送失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 移除成员
    const handleRemoveMember = async (memberId: number) => {
        try {
            // TODO: 调用API移除成员
            // await removeMember(memberId);
            setMembers(members.filter(member => member.id !== memberId));
            toast.success('成员已移除');
        } catch (error) {
            toast.error('移除成员失败');
        }
    };

    // 更新成员角色
    const handleUpdateRole = async (memberId: number, newRole: 'admin' | 'member') => {
        try {
            // TODO: 调用API更新角色
            // await updateMemberRole(memberId, newRole);
            setMembers(members.map(member =>
                member.id === memberId ? { ...member, role: newRole } : member
            ));
            toast.success('角色已更新');
        } catch (error) {
            toast.error('更新角色失败');
        }
    };

    // 取消邀请
    const handleCancelInvitation = async (invitationId: number) => {
        try {
            // TODO: 调用API取消邀请
            // await cancelInvitation(invitationId);
            setInvitations(invitations.filter(inv => inv.id !== invitationId));
            toast.success('邀请已取消');
        } catch (error) {
            toast.error('取消邀请失败');
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