import React from 'react';
import FamilySelector from '@/components/FamilySelector';
import FamilyMembers from '@/components/FamilyMembers';

export default function FamilySettingsPage() {
    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold">家庭设置</h1>
                <FamilySelector />
            </div>

            <FamilyMembers />
        </div>
    );
} 