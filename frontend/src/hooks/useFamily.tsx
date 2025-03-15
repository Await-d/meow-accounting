'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from '@/components/Toast';
import { fetchAPI } from '@/lib/api';
import type { Family, FamilyMember, User } from '@/lib/types';
import {
    getUserFamilies,
    getFamilyById,
    getFamilyMembers,
    addFamilyMember as apiAddFamilyMember,
    updateMemberRole as apiUpdateMemberRole,
    removeFamilyMember as apiRemoveFamilyMember
} from '@/lib/api';

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
                return result;
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
        queryFn: () => fetchAPI<FamilyMember[]>(`/families/${user?.currentFamilyId}/members`),
        enabled: !!user?.currentFamilyId && !hasError.current, // 不在错误状态下才启用查询
        staleTime: 5 * 60 * 1000, // 5分钟
        gcTime: 5 * 60 * 1000,
        retry: 1 // 只重试一次
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

    // 获取用户的待处理邀请
    const userInvitations = useUserInvitations();

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

                showToast('已切换到' + family.name, 'success');

                // 存储当前家庭ID到localStorage，用于API请求
                localStorage.setItem('currentFamilyId', family.id.toString());
            }
        },
        [user, updateUser, showToast, queryClient]
    );

    // 加载家庭成员
    const loadFamilyMembers = useCallback(async (familyId: number) => {
        try {
            const familyMembers = await getFamilyMembers(familyId);
            setMembers(familyMembers);
            return familyMembers;
        } catch (error) {
            console.error('加载家庭成员失败:', error);
            throw error;
        }
    }, []);

    const addMember = async (familyId: number, data: { userId: number; role: 'admin' | 'member' }) => {
        try {
            await apiAddFamilyMember(familyId, {
                userId: data.userId,
                role: data.role
            });
            // 重新加载家庭成员
            await loadFamilyMembers(familyId);
            return true;
        } catch (error) {
            console.error('添加成员失败:', error);
            throw error;
        }
    };

    const updateRole = async (familyId: number, userId: number, role: 'admin' | 'member') => {
        try {
            await apiUpdateMemberRole(familyId, userId, role);
            // 重新加载家庭成员
            await loadFamilyMembers(familyId);
            return true;
        } catch (error) {
            console.error('更新角色失败:', error);
            throw error;
        }
    };

    const removeMember = async (familyId: number, userId: number) => {
        try {
            await apiRemoveFamilyMember(familyId, userId);
            // 重新加载家庭成员
            await loadFamilyMembers(familyId);
            return true;
        } catch (error) {
            console.error('移除成员失败:', error);
            throw error;
        }
    };

    const isAdmin = () => {
        return currentFamily?.owner_id === user?.id || members?.some(m => m.user_id === user?.id && m.role === 'admin');
    };

    return {
        families,
        members: membersData || members,
        currentFamily,
        isLoading: isLoadingFamilies || isLoadingMembers,
        error: familiesError,
        setCurrentFamily,
        userInvitations,
        addMember,
        updateRole,
        removeMember,
        isAdmin
    };
}

export function useCreateFamily() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: { name: string; description: string }) =>
            fetchAPI<Family>('/families', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['families'] });
            showToast('创建成功', 'success');
        },
        onError: () => {
            showToast('创建失败', 'error');
        },
    });
}

export function useUpdateFamily() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: Family) =>
            fetchAPI<Family>(`/families/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['families'] });
            showToast('更新成功', 'success');
        },
        onError: () => {
            showToast('更新失败', 'error');
        },
    });
}

export function useDeleteFamily() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (id: number) =>
            fetchAPI(`/families/${id}`, {
                method: 'DELETE',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['families'] });
            showToast('删除成功', 'success');
        },
        onError: () => {
            showToast('删除失败', 'error');
        },
    });
}

export function useAddFamilyMember() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: {
            familyId: number;
            email: string;
            role: 'admin' | 'member';
            isGeneric?: boolean;
            expiresInHours?: number;
            maxUses?: number;
        }) =>
            fetchAPI<{ message: string; inviteLink: string; token: string; isGeneric: boolean; expiresInHours: number; maxUses: number }>(`/families/${data.familyId}/members`, {
                method: 'POST',
                body: JSON.stringify({
                    email: data.email,
                    role: data.role,
                    isGeneric: data.isGeneric,
                    expiresInHours: data.expiresInHours,
                    maxUses: data.maxUses
                }),
            }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['familyMembers', variables.familyId],
            });
            queryClient.invalidateQueries({
                queryKey: ['familyInvitations', variables.familyId],
            });
            showToast(data.isGeneric ? '通用邀请链接已创建' : '邀请已发送', 'success');
            return data;
        },
        onError: () => {
            showToast('邀请发送失败', 'error');
        },
    });
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: { familyId: number; memberId: number; role: 'admin' | 'member' }) =>
            fetchAPI<FamilyMember>(`/families/${data.familyId}/members/${data.memberId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    role: data.role,
                }),
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['familyMembers', variables.familyId],
            });
            showToast('更新成功', 'success');
        },
        onError: () => {
            showToast('更新失败', 'error');
        },
    });
}

export function useRemoveFamilyMember() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user, updateUser } = useAuth();

    return useMutation({
        mutationFn: (data: { familyId: number; memberId: number }) => {
            console.log('调用移除成员API:', data);
            return fetchAPI(`/families/${data.familyId}/members/${data.memberId}`, {
                method: 'DELETE',
            });
        },
        onSuccess: (response, variables) => {
            console.log('移除成员成功，刷新数据:', variables);
            queryClient.invalidateQueries({
                queryKey: ['familyMembers', variables.familyId],
            });

            // 如果是自己退出家庭，需要更新当前家庭ID
            if (user && variables.memberId === user.id) {
                // 查询用户的其他家庭
                queryClient.invalidateQueries({ queryKey: ['families'] });

                // 更新用户的当前家庭ID为undefined
                updateUser({
                    ...user,
                    currentFamilyId: undefined,
                });

                showToast('您已成功退出家庭', 'success');
            } else {
                showToast('移除成功', 'success');
            }
        },
        onError: (error) => {
            console.error('移除成员失败:', error);
            showToast('移除失败', 'error');
        },
    });
}

// 获取家庭的所有邀请
export function useFamilyInvitations(familyId?: number) {
    return useQuery({
        queryKey: ['familyInvitations', familyId],
        queryFn: () => fetchAPI<any[]>(`/families/${familyId}/invitations`),
        enabled: !!familyId,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

// 删除邀请
export function useDeleteInvitation() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: (data: { familyId: number; invitationId: number }) =>
            fetchAPI(`/families/${data.familyId}/invitations/${data.invitationId}`, {
                method: 'DELETE',
            }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['familyInvitations', variables.familyId],
            });
            showToast('邀请已删除', 'success');
        },
        onError: (error) => {
            console.error('删除邀请失败:', error);
            showToast('删除邀请失败', 'error');
        },
    });
}

// 获取用户的待处理邀请
export function useUserInvitations() {
    const { showToast } = useToast();

    return useQuery({
        queryKey: ['userInvitations'],
        queryFn: async () => {
            try {
                // 使用fetchAPI函数，确保正确处理认证
                const data = await fetchAPI<any[]>('/families/invitations');
                console.log('获取到的用户邀请:', data);
                return data || [];
            } catch (error) {
                console.error('获取用户邀请失败:', error);
                showToast('获取邀请失败', 'error');
                return [];
            }
        },
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 3,
    });
} 