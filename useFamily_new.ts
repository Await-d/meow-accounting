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

    // 鑾峰彇瀹跺涵鍒楄〃
    const { data: families, isLoading: isLoadingFamilies, error: familiesError } = useQuery({
        queryKey: ['families'],
        queryFn: async () => {
            try {
                const result = await fetchAPI<Family[]>('/families/user');
                hasError.current = false;
                return result;
            } catch (error) {
                console.error('鑾峰彇瀹跺涵鍒楄〃澶辫触:', error);
                hasError.current = true;
                throw error;
            }
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // 5鍒嗛挓
        retry: hasError.current ? 0 : 2 // 濡傛灉宸茬粡鏈夐敊璇紝涓嶅啀閲嶈瘯
    });

    // 鑾峰彇褰撳墠瀹跺涵
    const currentFamily = families?.find((f: Family) => f.id === user?.currentFamilyId);

    // 鑾峰彇褰撳墠瀹跺涵鎴愬憳
    const { data: membersData, isLoading: isLoadingMembers, error: membersError } = useQuery({
        queryKey: ['familyMembers', user?.currentFamilyId],
        queryFn: () => fetchAPI<FamilyMember[]>(`/families/${user?.currentFamilyId}/members`),
        enabled: !!user?.currentFamilyId && !hasError.current, // 涓嶅湪閿欒鐘舵€佷笅鎵嶅惎鐢ㄦ煡璇?        staleTime: 5 * 60 * 1000, // 5鍒嗛挓
        gcTime: 5 * 60 * 1000,
        retry: 1 // 鍙噸璇曚竴娆?    });

    // 浣跨敤useEffect澶勭悊閿欒
    useEffect(() => {
        if (familiesError) {
            console.error('鑾峰彇瀹跺涵鍒楄〃澶辫触:', familiesError);
        }
    }, [familiesError]);

    useEffect(() => {
        if (membersError) {
            console.error('鑾峰彇瀹跺涵鎴愬憳澶辫触:', membersError);
        }
    }, [membersError]);

    // 鑾峰彇鐢ㄦ埛鐨勫緟澶勭悊閭€璇?    const userInvitations = useUserInvitations();

    // 璁剧疆褰撳墠瀹跺涵
    const setCurrentFamily = useCallback(
        (family: Family) => {
            if (user) {
                updateUser({
                    ...user,
                    currentFamilyId: family.id,
                } as User);

                // 鍒囨崲瀹跺涵鍚庡埛鏂扮浉鍏虫暟鎹?                queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['categories'] });
                queryClient.invalidateQueries({ queryKey: ['statistics'] });
                queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
                queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });

                // 瀛樺偍褰撳墠瀹跺涵ID鍒發ocalStorage锛岀敤浜嶢PI璇锋眰
                localStorage.setItem('currentFamilyId', family.id.toString());
            }
        },
        [user, updateUser, showToast, queryClient]
    );

    // 鍔犺浇瀹跺涵鎴愬憳
    const loadFamilyMembers = useCallback(async (familyId: number) => {
        try {
            const familyMembers = await getFamilyMembers(familyId);
            setMembers(familyMembers);
            return familyMembers;
        } catch (error) {
            console.error('鍔犺浇瀹跺涵鎴愬憳澶辫触:', error);
            throw error;
        }
    }, []);

    const addMember = async (familyId: number, data: { userId: number; role: 'admin' | 'member' }) => {
        try {
            await apiAddFamilyMember(familyId, {
                userId: data.userId,
                role: data.role
            });
            // 閲嶆柊鍔犺浇瀹跺涵鎴愬憳
            await loadFamilyMembers(familyId);
            return true;
        } catch (error) {
            console.error('娣诲姞鎴愬憳澶辫触:', error);
            throw error;
        }
    };

    const updateRole = async (familyId: number, userId: number, role: 'admin' | 'member') => {
        try {
            await apiUpdateMemberRole(familyId, userId, role);
            // 閲嶆柊鍔犺浇瀹跺涵鎴愬憳
            await loadFamilyMembers(familyId);
            return true;
        } catch (error) {
            console.error('鏇存柊瑙掕壊澶辫触:', error);
            throw error;
        }
    };

    const removeMember = async (familyId: number, userId: number) => {
        try {
            await apiRemoveFamilyMember(familyId, userId);
            // 閲嶆柊鍔犺浇瀹跺涵鎴愬憳
            await loadFamilyMembers(familyId);
            return true;
        } catch (error) {
            console.error('绉婚櫎鎴愬憳澶辫触:', error);
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
            showToast('鍒涘缓鎴愬姛', 'success');
        },
        onError: () => {
            showToast('鍒涘缓澶辫触', 'error');
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
            showToast('鏇存柊鎴愬姛', 'success');
        },
        onError: () => {
            showToast('鏇存柊澶辫触', 'error');
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
            showToast('鍒犻櫎鎴愬姛', 'success');
        },
        onError: () => {
            showToast('鍒犻櫎澶辫触', 'error');
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
            showToast(data.isGeneric ? '閫氱敤閭€璇烽摼鎺ュ凡鍒涘缓' : '閭€璇峰凡鍙戦€?, 'success');
            return data;
        },
        onError: () => {
            showToast('閭€璇峰彂閫佸け璐?, 'error');
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
            showToast('鏇存柊鎴愬姛', 'success');
        },
        onError: () => {
            showToast('鏇存柊澶辫触', 'error');
        },
    });
}

export function useRemoveFamilyMember() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user, updateUser } = useAuth();

    return useMutation({
        mutationFn: (data: { familyId: number; memberId: number }) => {
            console.log('璋冪敤绉婚櫎鎴愬憳API:', data);
            return fetchAPI(`/families/${data.familyId}/members/${data.memberId}`, {
                method: 'DELETE',
            });
        },
        onSuccess: (response, variables) => {
            console.log('绉婚櫎鎴愬憳鎴愬姛锛屽埛鏂版暟鎹?', variables);
            queryClient.invalidateQueries({
                queryKey: ['familyMembers', variables.familyId],
            });

            // 濡傛灉鏄嚜宸遍€€鍑哄搴紝闇€瑕佹洿鏂板綋鍓嶅搴璉D
            if (user && variables.memberId === user.id) {
                // 鏌ヨ鐢ㄦ埛鐨勫叾浠栧搴?                queryClient.invalidateQueries({ queryKey: ['families'] });

                // 鏇存柊鐢ㄦ埛鐨勫綋鍓嶅搴璉D涓簎ndefined
                updateUser({
                    ...user,
                    currentFamilyId: undefined,
                });

                showToast('鎮ㄥ凡鎴愬姛閫€鍑哄搴?, 'success');
            } else {
                showToast('绉婚櫎鎴愬姛', 'success');
            }
        },
        onError: (error) => {
            console.error('绉婚櫎鎴愬憳澶辫触:', error);
            showToast('绉婚櫎澶辫触', 'error');
        },
    });
}

// 鑾峰彇瀹跺涵鐨勬墍鏈夐個璇?export function useFamilyInvitations(familyId?: number) {
    return useQuery({
        queryKey: ['familyInvitations', familyId],
        queryFn: () => fetchAPI<any[]>(`/families/${familyId}/invitations`),
        enabled: !!familyId,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

// 鍒犻櫎閭€璇?export function useDeleteInvitation() {
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
            showToast('閭€璇峰凡鍒犻櫎', 'success');
        },
        onError: (error) => {
            console.error('鍒犻櫎閭€璇峰け璐?', error);
            showToast('鍒犻櫎閭€璇峰け璐?, 'error');
        },
    });
}

// 鑾峰彇鐢ㄦ埛鐨勫緟澶勭悊閭€璇?export function useUserInvitations() {
    const { showToast } = useToast();

    return useQuery({
        queryKey: ['userInvitations'],
        queryFn: async () => {
            try {
                // 浣跨敤fetchAPI鍑芥暟锛岀‘淇濇纭鐞嗚璇?                const data = await fetchAPI<any[]>('/families/invitations');
                console.log('鑾峰彇鍒扮殑鐢ㄦ埛閭€璇?', data);
                return data || [];
            } catch (error) {
                console.error('鑾峰彇鐢ㄦ埛閭€璇峰け璐?', error);
                showToast('鑾峰彇閭€璇峰け璐?, 'error');
                return [];
            }
        },
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 3,
    });
} 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';

// Types
export interface Family {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    members: FamilyMember[];
}

export interface FamilyMember {
    id: number;
    userId: number;
    familyId: number;
    role: 'admin' | 'member';
    joinedAt: string;
    name: string;
    email: string;
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

// Hooks
export function useFamily(familyId?: number) {
    return useQuery<Family | null>({
        queryKey: ['family', familyId],
        queryFn: async () => {
            if (!familyId) return null;
            const response = await fetchAPI<Family>(`/families/${familyId}`);
            return response.data;
        },
        enabled: !!familyId
    });
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
            showToast('瀹跺涵鍒涘缓鎴愬姛', 'success');
            queryClient.invalidateQueries({ queryKey: ['families'] });
        },
        onError: (error: Error) => {
            showToast(`鍒涘缓澶辫触: ${error.message}`, 'error');
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
            showToast('瀹跺涵淇℃伅宸叉洿鏂?, 'success');
            queryClient.invalidateQueries({ queryKey: ['families'] });
        },
        onError: (error: Error) => {
            showToast(`鏇存柊澶辫触: ${error.message}`, 'error');
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
            showToast('瀹跺涵宸插垹闄?, 'success');
            queryClient.invalidateQueries({ queryKey: ['families'] });
        },
        onError: (error: Error) => {
            showToast(`鍒犻櫎澶辫触: ${error.message}`, 'error');
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
            showToast('鎴愬憳宸叉坊鍔?, 'success');
            queryClient.invalidateQueries({ queryKey: ['family'] });
        },
        onError: (error: Error) => {
            showToast(`娣诲姞澶辫触: ${error.message}`, 'error');
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
            showToast('鎴愬憳瑙掕壊宸叉洿鏂?, 'success');
            queryClient.invalidateQueries({ queryKey: ['family'] });
        },
        onError: (error: Error) => {
            showToast(`鏇存柊澶辫触: ${error.message}`, 'error');
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
            showToast('鎴愬憳宸茬Щ闄?, 'success');
            queryClient.invalidateQueries({ queryKey: ['family'] });
        },
        onError: (error: Error) => {
            showToast(`绉婚櫎澶辫触: ${error.message}`, 'error');
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
            showToast('閭€璇峰凡鍒犻櫎', 'success');
            queryClient.invalidateQueries({ queryKey: ['familyInvitations'] });
        },
        onError: (error: Error) => {
            showToast(`鍒犻櫎澶辫触: ${error.message}`, 'error');
        }
    });
} 
