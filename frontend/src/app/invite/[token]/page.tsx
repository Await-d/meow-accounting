'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';

interface InvitationInfo {
    id: number;
    family_id: number;
    email: string | null;
    role: 'admin' | 'member';
    token: string;
    expires_at: string;
    created_at: string;
    created_by: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    family_name: string;
}

export default function InvitePage({ params }: { params: { token: string } }) {
    const { token } = params;
    const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [redirected, setRedirected] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();
    const { user } = useAuth();

    // 获取邀请信息
    useEffect(() => {
        // 防止重复获取
        if (!loading || redirected) return;

        const fetchInvitation = async () => {
            try {
                const data = await fetchAPI<InvitationInfo>(`/families/invitations/${token}`);
                setInvitation(data);
                setLoading(false);
            } catch (error: any) {
                console.error('获取邀请信息失败:', error);
                setError(error.message || '邀请不存在或已过期');
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [token, loading, redirected]);

    // 处理认证状态
    useEffect(() => {
        // 只有在邀请信息加载完成后才检查认证状态
        if (loading || redirected) return;

        // 如果用户未登录，重定向到登录页面
        if (!user) {
            setRedirected(true);
            const redirectUrl = `/auth/login?redirect=/invite/${token}`;
            console.log('重定向到登录页面:', redirectUrl);
            router.push(redirectUrl);
        }
    }, [user, token, router, loading, redirected]);

    const handleAccept = async () => {
        if (!invitation || !user) return;

        setProcessing(true);
        try {
            await fetchAPI(`/families/invitations/${token}/accept`, {
                method: 'POST',
            });
            showToast('已成功加入家庭', 'success');
            router.push('/settings/family');
        } catch (error: any) {
            showToast(error.message || '接受邀请失败', 'error');
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!invitation || !user) return;

        setProcessing(true);
        try {
            await fetchAPI(`/families/invitations/${token}/reject`, {
                method: 'POST',
            });
            showToast('已拒绝邀请', 'success');
            router.push('/settings/family');
        } catch (error: any) {
            showToast(error.message || '拒绝邀请失败', 'error');
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-12 p-4">
                <Card>
                    <CardBody className="flex flex-col items-center text-center p-8 gap-4">
                        <div className="text-danger text-5xl mb-4">✗</div>
                        <h1 className="text-2xl font-bold">邀请无效</h1>
                        <p className="text-default-500">{error}</p>
                        <Button
                            color="primary"
                            onPress={() => router.push('/settings/family')}
                            className="mt-4"
                        >
                            返回家庭设置
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    if (!invitation || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    // 移除前端的邮箱验证，让后端处理

    return (
        <div className="max-w-md mx-auto mt-12 p-4">
            <Card>
                <CardBody className="flex flex-col items-center text-center p-8 gap-4">
                    <div className="text-primary text-5xl mb-4">🏠</div>
                    <h1 className="text-2xl font-bold">家庭邀请</h1>
                    <p className="text-default-700">
                        您被邀请加入 <span className="font-bold">{invitation.family_name}</span> 家庭
                    </p>
                    <p className="text-default-500">
                        您将以 <span className="font-medium">
                            {invitation.role === 'admin' ? '管理员' : '成员'}
                        </span> 身份加入此家庭
                    </p>

                    <div className="text-sm text-default-400 mt-2">
                        邀请将于 {new Date(invitation.expires_at).toLocaleString()} 过期
                    </div>

                    <div className="flex gap-4 mt-6 w-full">
                        <Button
                            color="danger"
                            variant="flat"
                            onPress={handleReject}
                            isDisabled={processing}
                            className="flex-1"
                        >
                            拒绝
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleAccept}
                            isDisabled={processing}
                            isLoading={processing}
                            className="flex-1"
                        >
                            接受
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
} 