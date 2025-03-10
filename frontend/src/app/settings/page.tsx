'use client';

import { useEffect } from 'react';
import { Card, CardBody, CardHeader, Tabs, Tab } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import ProfileSettings from '@/components/ProfileSettings';
import RouteSettings from '@/components/RouteSettings';
import PrivacySettings from '@/components/PrivacySettings';
import FamilySettings from '@/components/FamilySettings';
import RouteAnalytics from '@/components/RouteAnalytics';

export default function SettingsPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">
                        {currentRoute?.name || '设置'}
                    </h1>
                </CardHeader>
                <CardBody>
                    <Tabs aria-label="设置选项">
                        <Tab key="profile" title="个人资料">
                            <ProfileSettings />
                        </Tab>
                        <Tab key="routes" title="路由管理">
                            <div className="space-y-6">
                                <RouteSettings />
                                <RouteAnalytics />
                            </div>
                        </Tab>
                        <Tab key="privacy" title="隐私设置">
                            <PrivacySettings />
                        </Tab>
                        <Tab key="family" title="家庭管理">
                            <FamilySettings />
                        </Tab>
                    </Tabs>
                </CardBody>
            </Card>
        </div>
    );
} 