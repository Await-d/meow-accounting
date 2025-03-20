/*
 * @Author: Await
 * @Date: 2025-03-17 21:16:11
 * @LastEditors: Await
 * @LastEditTime: 2025-03-18 21:04:37
 * @Description: 请填写简介
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useAuth } from './useAuth';
import type { User } from '@/lib/types';

// Types
export interface Family {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    members: FamilyMember[];
    owner_id?: number;
}

export interface FamilyMember {
    id: number;
    userId: number;
    familyId: number;
    role: 'admin' | 'member';
    joinedAt: string;
    name: string;
    email: string;
    user_id?: number;
}

export interface FamilyInvitation {
    id: number;
    familyId: number;
    email: string;
    role: 'admin' | 'member';
    expiresAt: string;
    isGeneric: boolean;
    maxUses: number;
    usedCount: number;
    createdAt: string;
    createdBy: number;
    inviteCode: string;
}

// Main Family Hook
export function useFamily() {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const hasError = useRef(false);

    // 获取家庭列表
    const { data: families, isLoading: isLoadingFamilies, error: familiesError } = useQuery({
        queryKey: ['families'],
        queryFn: async () => {
            try {
                const result = await fetchAPI<Family[]>('/families/user');
                hasError.current = false;
                return result.data;
            } catch (error) {
                console.error('获取家庭列表失败:', error);
                hasError.current = true;
                throw error;
            }
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5分钟
        retry: hasError.current ? 0 : 2 // 如果已经有错误，不再重试
    });

    // 获取当前家庭
    const currentFamily = families?.find((f: Family) => f.id === user?.currentFamilyId);

    // 获取当前家庭成员
    const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useQuery({
        queryKey: ['familyMembers', user?.currentFamilyId],
        queryFn: async () => {
            const response = await fetchAPI<FamilyMember[]>(`/families/${user?.currentFamilyId}/members`);
            return response.data;
        },
        enabled: !!user?.currentFamilyId && !hasError.current,
        staleTime: 5 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1
    });

    // 使用useEffect处理错误
    useEffect(() => {
        if (familiesError) {
            console.error('获取家庭列表失败:', familiesError);
        }
    }, [familiesError]);

    useEffect(() => {
        if (membersError) {
            console.error('获取家庭成员失败:', membersError);
        }
    }, [membersError]);

    // 设置当前家庭
    const setCurrentFamily = useCallback(
        (family: Family) => {
            if (user) {
                updateUser({
                    ...user,
                    currentFamilyId: family.id,
                } as User);

                // 切换家庭后刷新相关数据
                queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['categories'] });
                queryClient.invalidateQueries({ queryKey: ['statistics'] });
                queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
                queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });

                // 存储当前家庭ID到localStorage
                localStorage.setItem('currentFamilyId', family.id.toString());
            }
        },
        [user, updateUser, queryClient]
    );

    const isAdmin = useCallback(() => {
        return currentFamily?.owner_id === user?.id ||
            membersData?.some(m => m.user_id === user?.id && m.role === 'admin');
    }, [currentFamily, user, membersData]);

    return {
        families,
        members: membersData || members,
        currentFamily,
        isLoading: isLoadingFamilies || isLoadingMembers,
        error: familiesError,
        setCurrentFamily,
        isAdmin
    };
}

export function useCreateFamily() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (data: Partial<Family>) => {
            const response = await fetchAPI<Family>('/families', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('家庭创建成功', 'success');
            queryClient.invalidateQueries({ queryKey: ['families'] });
        },
        onError: (error: Error) => {
            showToast(`创建失败: ${error.message}`, 'error');
        }
    });
}

export function useUpdateFamily() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ familyId, data }: { familyId: number; data: Partial<Family> }) => {
            const response = await fetchAPI<Family>(`/families/${familyId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('家庭信息已更新', 'success');
            queryClient.invalidateQueries({ queryKey: ['families'] });
        },
        onError: (error: Error) => {
            showToast(`更新失败: ${error.message}`, 'error');
        }
    });
}

export function useDeleteFamily() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (familyId: number) => {
            await fetchAPI<void>(`/families/${familyId}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            showToast('家庭已删除', 'success');
            queryClient.invalidateQueries({ queryKey: ['families'] });
        },
        onError: (error: Error) => {
            showToast(`删除失败: ${error.message}`, 'error');
        }
    });
}

export function useAddFamilyMember() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ familyId, data }: { familyId: number; data: { email: string; role: string } }) => {
            const response = await fetchAPI<FamilyMember>(`/families/${familyId}/members`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('成员已添加', 'success');
            queryClient.invalidateQueries({ queryKey: ['family'] });
        },
        onError: (error: Error) => {
            showToast(`添加失败: ${error.message}`, 'error');
        }
    });
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ familyId, memberId, role }: { familyId: number; memberId: number; role: string }) => {
            const response = await fetchAPI<FamilyMember>(`/families/${familyId}/members/${memberId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role })
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('成员角色已更新', 'success');
            queryClient.invalidateQueries({ queryKey: ['family'] });
        },
        onError: (error: Error) => {
            showToast(`更新失败: ${error.message}`, 'error');
        }
    });
}

export function useRemoveFamilyMember() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ familyId, memberId }: { familyId: number; memberId: number }) => {
            await fetchAPI<void>(`/families/${familyId}/members/${memberId}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            showToast('成员已移除', 'success');
            queryClient.invalidateQueries({ queryKey: ['family'] });
        },
        onError: (error: Error) => {
            showToast(`移除失败: ${error.message}`, 'error');
        }
    });
}

export function useFamilyInvitations(familyId?: number) {
    return useQuery<FamilyInvitation[]>({
        queryKey: ['familyInvitations', familyId],
        queryFn: async () => {
            if (!familyId) return [];
            const response = await fetchAPI<FamilyInvitation[]>(`/families/${familyId}/invitations`);
            return response.data;
        },
        enabled: !!familyId
    });
}

export function useDeleteInvitation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ familyId, invitationId }: { familyId: number; invitationId: number }) => {
            await fetchAPI<void>(`/families/${familyId}/invitations/${invitationId}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            showToast('邀请已删除', 'success');
            queryClient.invalidateQueries({ queryKey: ['familyInvitations'] });
        },
        onError: (error: Error) => {
            showToast(`删除失败: ${error.message}`, 'error');
        }
    });
} 