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
