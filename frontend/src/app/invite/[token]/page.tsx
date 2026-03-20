'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import PageLayout from '@/components/PageLayout';
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
                setInvitation(data.data);
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
            <PageLayout title="加载邀请" description="正在检索邀请信息，请稍候。" backgroundVariant="minimal">
                <div className="flex justify-center items-center h-[40vh]">
                    <Spinner size="lg" />
                </div>
            </PageLayout>
        );
    }


    if (error) {
        return (
            <PageLayout title="邀请无效" description={error} backgroundVariant="minimal">
                <Card className="border border-default-100 bg-background/70 backdrop-blur max-w-md mx-auto">
                    <CardBody className="flex flex-col items-center text-center p-8 gap-4">
                        <div className="text-danger text-5xl mb-2">✗</div>
                        <h1 className="text-2xl font-bold">邀请无效</h1>
                        <p className="text-default-500">{error}</p>
                        <Button color="primary" onPress={() => router.push('/settings/family')}>
                            返回家庭设置
                        </Button>
                    </CardBody>
                </Card>
            </PageLayout>
        );
    }


    if (!invitation || !user) {
        return (
            <PageLayout title="验证身份" description="正在确认您的账户信息。" backgroundVariant="minimal">
                <div className="flex justify-center items-center h-[40vh]">
                    <Spinner size="lg" />
                </div>
            </PageLayout>
        );
    }


    // 移除前端的邮箱验证，让后端处理

    return (
        <PageLayout
            title="家庭邀请"
            description={`邀请加入 ${invitation.family_name} 家庭`}
            backgroundVariant="minimal"
        >
            <Card className="border border-default-100 bg-background/70 backdrop-blur max-w-md mx-auto">
                <CardBody className="flex flex-col items-center text-center p-8 gap-4">
                    <div className="text-primary text-5xl mb-2">🏠</div>
                    <p className="text-default-700">
                        您将以 <span className="font-medium">{invitation.role === 'admin' ? '管理员' : '成员'}</span> 身份加入
                        <span className="font-bold ml-1">{invitation.family_name}</span>
                    </p>
                    <p className="text-default-500">
                        邀请将于 {new Date(invitation.expires_at).toLocaleString()} 过期
                    </p>

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
        </PageLayout>
    );
} 
