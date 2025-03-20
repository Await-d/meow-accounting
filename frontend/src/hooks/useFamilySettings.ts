/*
 * @Author: Await
 * @Date: 2025-03-17 21:09:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-18 18:59:12
 * @Description: 请填写简介
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';

export interface FamilySettings {
    defaultSharedBooks: boolean;
    expenseLimitAlert: boolean;
    newMemberNotification: boolean;
    largeExpenseNotification: boolean;
    budgetOverspendingNotification: boolean;
}

export function useFamilySettings(familyId?: number) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // 获取家庭设置
    const { data: settings, isLoading } = useQuery<FamilySettings>({
        queryKey: ['familySettings', familyId],
        queryFn: async () => {
            if (!familyId) return null;
            const response = await fetchAPI(`/families/${familyId}/settings`);
            return response.data;
        },
        enabled: !!familyId
    });

    // 更新家庭设置
    const { mutate: updateSettings } = useMutation({
        mutationFn: async (newSettings: Partial<FamilySettings>) => {
            if (!familyId) throw new Error('No family selected');
            const response = await fetchAPI(`/families/${familyId}/settings`, {
                method: 'PATCH',
                body: JSON.stringify(newSettings)
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('设置已保存', 'success');
            queryClient.invalidateQueries({ queryKey: ['familySettings', familyId] });
        },
        onError: (error: Error) => {
            showToast(`保存设置失败: ${error.message}`, 'error');
        }
    });

    return {
        settings,
        isLoading,
        updateSettings
    };
} 