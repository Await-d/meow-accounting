'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Spinner } from '@nextui-org/react';
import { useUserInvitations } from '@/hooks/useFamily';
import { useToast } from '@/components/Toast';
import { fetchAPI } from '@/lib/api';
import InvitationList from '@/components/InvitationList';
import Skeleton from '@/components/Skeleton';
import { useRouter } from 'next/navigation';

export default function InvitationsPage() {
    const { data: invitations, isLoading, refetch } = useUserInvitations();
    const { showToast } = useToast();
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    const handleAccept = async (token: string) => {
        setProcessing(true);
        try {
            await fetchAPI(`/families/invitations/${token}/accept`, {
                method: 'POST',
            });
            showToast('已成功加入家庭', 'success');
            refetch();
            router.push('/settings/family');
        } catch (error: any) {
            showToast(error.message || '接受邀请失败', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (token: string) => {
        setProcessing(true);
        try {
            await fetchAPI(`/families/invitations/${token}/reject`, {
                method: 'POST',
            });
            showToast('已拒绝邀请', 'success');
            refetch();
        } catch (error: any) {
            showToast(error.message || '拒绝邀请失败', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto">
                <Skeleton type="table" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">我的邀请</h2>
                            <p className="text-sm text-default-500 mt-1">
                                管理您收到的家庭邀请
                            </p>
                        </div>
                    </div>

                    <InvitationList
                        invitations={invitations || []}
                        type="received"
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />
                </CardBody>
            </Card>
        </div>
    );
} 