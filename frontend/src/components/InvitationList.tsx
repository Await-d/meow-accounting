'use client';

import { useState, useMemo } from 'react';
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Tooltip,
    Badge,
} from '@nextui-org/react';
import { ClipboardDocumentIcon, EnvelopeIcon, InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

interface Invitation {
    id: number;
    email: string | null;
    role: 'admin' | 'member';
    token: string;
    expires_at: string;
    created_at: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    creator_name?: string;
    creator_email?: string;
    family_name?: string;
    max_uses?: number;
    current_uses?: number;
    is_generic?: boolean;
}

interface InvitationListProps {
    invitations: Invitation[];
    type: 'sent' | 'received';
    onAccept?: (token: string) => void;
    onReject?: (token: string) => void;
    onDelete?: (id: number) => void;
}

export default function InvitationList({ invitations, type, onAccept, onReject, onDelete }: InvitationListProps) {
    const { showToast } = useToast();
    const [processing, setProcessing] = useState<number | null>(null);

    const handleCopyInviteLink = (token: string) => {
        const inviteLink = `${window.location.origin}/invite/${token}`;
        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                showToast('邀请链接已复制到剪贴板', 'success');
            })
            .catch(() => {
                showToast('复制失败，请手动复制', 'error');
            });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const isExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date();
    };

    const getRemainingTime = (expiresAt: string) => {
        const now = new Date();
        const expireDate = new Date(expiresAt);
        const diffMs = expireDate.getTime() - now.getTime();

        if (diffMs <= 0) return '已过期';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
            return `${diffDays}天${diffHours}小时`;
        } else {
            return `${diffHours}小时`;
        }
    };

    const getStatusChip = (invitation: Invitation) => {
        const { status, expires_at, max_uses, current_uses } = invitation;

        // 如果已过期
        if ((status === 'pending' && isExpired(expires_at)) || status === 'expired') {
            return <Chip color="default" variant="flat" size="sm">已过期</Chip>;
        }

        // 根据状态显示不同的标签
        switch (status) {
            case 'pending':
                // 如果是多次使用的邀请，显示使用次数
                if (max_uses && max_uses > 1) {
                    const usesLeft = max_uses - (current_uses || 0);
                    return (
                        <div className="flex items-center gap-2">
                            <Chip color="warning" variant="flat" size="sm">待处理</Chip>
                            <Badge content={`${usesLeft}/${max_uses}`} color="primary" size="sm">
                                <Tooltip content={`最多可使用${max_uses}次，已使用${current_uses || 0}次，剩余${usesLeft}次`}>
                                    <InformationCircleIcon className="h-4 w-4 text-primary cursor-help" />
                                </Tooltip>
                            </Badge>
                        </div>
                    );
                }
                return <Chip color="warning" variant="flat" size="sm">待处理</Chip>;
            case 'accepted':
                // 如果是多次使用的邀请，即使已接受也显示剩余次数
                if (max_uses && max_uses > 1) {
                    const usesLeft = max_uses - (current_uses || 0);
                    if (usesLeft > 0) {
                        return (
                            <div className="flex items-center gap-2">
                                <Chip color="success" variant="flat" size="sm">已接受</Chip>
                                <Badge content={`${usesLeft}/${max_uses}`} color="primary" size="sm">
                                    <Tooltip content={`最多可使用${max_uses}次，已使用${current_uses || 0}次，还可使用${usesLeft}次`}>
                                        <InformationCircleIcon className="h-4 w-4 text-primary cursor-help" />
                                    </Tooltip>
                                </Badge>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <Chip color="success" variant="flat" size="sm">已接受</Chip>
                            <Chip color="default" variant="flat" size="sm">已用完</Chip>
                        </div>
                    );
                }
                return <Chip color="success" variant="flat" size="sm">已接受</Chip>;
            case 'rejected':
                // 如果是多次使用的邀请，即使已拒绝也显示剩余次数
                if (max_uses && max_uses > 1) {
                    const usesLeft = max_uses - (current_uses || 0);
                    if (usesLeft > 0) {
                        return (
                            <div className="flex items-center gap-2">
                                <Chip color="danger" variant="flat" size="sm">已拒绝</Chip>
                                <Badge content={`${usesLeft}/${max_uses}`} color="primary" size="sm">
                                    <Tooltip content={`最多可使用${max_uses}次，已使用${current_uses || 0}次，还可使用${usesLeft}次`}>
                                        <InformationCircleIcon className="h-4 w-4 text-primary cursor-help" />
                                    </Tooltip>
                                </Badge>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-2">
                            <Chip color="danger" variant="flat" size="sm">已拒绝</Chip>
                            <Chip color="default" variant="flat" size="sm">已用完</Chip>
                        </div>
                    );
                }
                return <Chip color="danger" variant="flat" size="sm">已拒绝</Chip>;
            default:
                return null;
        }
    };

    const handleAccept = async (token: string, id: number) => {
        if (!onAccept) return;

        setProcessing(id);
        try {
            await onAccept(token);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (token: string, id: number) => {
        if (!onReject) return;

        setProcessing(id);
        try {
            await onReject(token);
        } finally {
            setProcessing(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!onDelete) return;

        if (confirm('确定要删除此邀请吗？')) {
            setProcessing(id);
            try {
                await onDelete(id);
            } finally {
                setProcessing(null);
            }
        }
    };

    // 定义列配置
    const columns = useMemo(() => {
        if (type === 'sent') {
            return [
                { key: 'recipient', label: '接收者' },
                { key: 'role', label: '角色' },
                { key: 'status', label: '状态' },
                { key: 'usage', label: '使用次数' },
                { key: 'created_at', label: '创建时间' },
                { key: 'expires_at', label: '有效期' },
                { key: 'actions', label: '操作' },
            ];
        } else {
            // 收到的邀请只显示必要的列
            return [
                { key: 'family', label: '家庭' },
                { key: 'creator', label: '邀请人' },
                { key: 'role', label: '角色' },
                { key: 'expires_at', label: '有效期' },
                { key: 'actions', label: '操作' },
            ];
        }
    }, [type]);

    // 渲染单元格
    const renderCell = (invitation: Invitation, columnKey: string) => {
        console.log(`渲染单元格: ${columnKey}`, invitation); // 添加日志，查看渲染过程

        switch (columnKey) {
            case 'recipient':
                return (
                    <div className="font-medium">
                        {invitation.is_generic || !invitation.email
                            ? <Chip color="secondary" variant="flat" size="sm">通用邀请</Chip>
                            : invitation.email.replace(/(.{2})(.*)(@.*)/, '$1****$3')}
                    </div>
                );
            case 'family':
                return (
                    <div className="font-medium">
                        {invitation.family_name}
                        {invitation.is_generic && (
                            <Chip color="secondary" variant="flat" size="sm" className="ml-2">
                                通用邀请
                            </Chip>
                        )}
                    </div>
                );
            case 'creator':
                return (
                    <div className="text-default-500">
                        {invitation.creator_name}
                        {invitation.max_uses && invitation.max_uses > 1 && (
                            <div className="text-xs mt-1">
                                可使用{invitation.max_uses}次，已使用{invitation.current_uses || 0}次
                            </div>
                        )}
                    </div>
                );
            case 'role':
                return (
                    <Chip color={invitation.role === 'admin' ? 'primary' : 'default'} variant="flat" size="sm">
                        {invitation.role === 'admin' ? '管理员' : '成员'}
                    </Chip>
                );
            case 'status':
                return getStatusChip(invitation);
            case 'usage':
                console.log('渲染使用次数:', invitation.max_uses, invitation.current_uses);
                // 确保显示使用次数，即使max_uses为undefined
                const maxUses = invitation.max_uses || 1;
                const currentUses = invitation.current_uses || 0;
                const remainingUses = maxUses - currentUses;

                return (
                    <div className="flex items-center gap-2">
                        <div className="text-default-500 text-sm">
                            {currentUses}/{maxUses}
                        </div>
                        {maxUses > 1 && (
                            <Tooltip content={`最多可使用${maxUses}次，已使用${currentUses}次，剩余${remainingUses}次`}>
                                <Badge content={`${remainingUses}`} color="primary" size="sm">
                                    <InformationCircleIcon className="h-4 w-4 text-default-400 cursor-help" />
                                </Badge>
                            </Tooltip>
                        )}
                    </div>
                );
            case 'created_at':
                return (
                    <div className="text-default-500 text-sm">
                        {formatDate(invitation.created_at)}
                    </div>
                );
            case 'expires_at':
                return (
                    <div className="text-default-500 text-sm">
                        <div>{formatDate(invitation.expires_at)}</div>
                        <div className="text-xs mt-1">
                            {invitation.status === 'pending' ? `剩余: ${getRemainingTime(invitation.expires_at)}` : ''}
                        </div>
                    </div>
                );
            case 'actions':
                if (type === 'sent') {
                    return (
                        <div className="flex items-center gap-2">
                            {/* 待处理状态的邀请显示复制按钮 */}
                            {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                                <Tooltip content="复制邀请链接">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => handleCopyInviteLink(invitation.token)}
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                    </Button>
                                </Tooltip>
                            )}

                            {/* 通用邀请且未过期，显示复制按钮 */}
                            {(invitation.is_generic || !invitation.email) &&
                                !isExpired(invitation.expires_at) &&
                                invitation.status !== 'pending' && (
                                    <Tooltip content="复制邀请链接">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => handleCopyInviteLink(invitation.token)}
                                        >
                                            <ClipboardDocumentIcon className="h-4 w-4" />
                                        </Button>
                                    </Tooltip>
                                )}

                            {/* 所有邀请都显示删除按钮 */}
                            {onDelete && (
                                <Tooltip content="删除邀请">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        onPress={() => handleDelete(invitation.id)}
                                        isDisabled={processing === invitation.id}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </Tooltip>
                            )}
                        </div>
                    );
                } else {
                    return (
                        <div className="flex items-center gap-2">
                            {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                                <>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        onPress={() => handleReject(invitation.token, invitation.id)}
                                        isDisabled={processing === invitation.id}
                                    >
                                        拒绝
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="primary"
                                        onPress={() => handleAccept(invitation.token, invitation.id)}
                                        isDisabled={processing === invitation.id}
                                        isLoading={processing === invitation.id}
                                    >
                                        接受
                                    </Button>
                                </>
                            )}
                        </div>
                    );
                }
                return null;
            default:
                return null;
        }
    };

    if (invitations.length === 0) {
        return (
            <Card>
                <CardBody className="py-8 text-center">
                    <div className="text-default-400 mb-2">
                        <EnvelopeIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-default-600">
                        {type === 'sent' ? '暂无已发送的邀请' : '暂无收到的邀请'}
                    </p>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table
                aria-label={type === 'sent' ? '已发送的邀请' : '收到的邀请'}
                classNames={{
                    base: "min-w-full",
                    table: "min-w-full",
                    thead: "bg-default-50",
                    th: "text-default-700 font-semibold",
                    tr: "hover:bg-default-50 transition-colors border-b border-default-100",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.key} className="text-sm">
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={invitations} emptyContent={"暂无邀请"}>
                    {(invitation) => {
                        console.log('渲染行:', invitation); // 添加日志，查看行渲染
                        return (
                            <TableRow key={invitation.id} className="h-14">
                                {(columnKey) => {
                                    console.log('渲染列:', columnKey.toString()); // 添加日志，查看列渲染
                                    return (
                                        <TableCell>{renderCell(invitation, columnKey.toString())}</TableCell>
                                    );
                                }}
                            </TableRow>
                        );
                    }}
                </TableBody>
            </Table>
        </div>
    );
} 