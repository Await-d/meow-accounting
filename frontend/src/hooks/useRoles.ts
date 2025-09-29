import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';

export interface Permission {
    id: number;
    name: string;
    description: string;
    code: string;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
    isSystem?: boolean;
}

export function useRoles(familyId?: number) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // 获取所有角色
    const { data: roles, isLoading } = useQuery<Role[]>({
        queryKey: ['roles', familyId],
        queryFn: async () => {
            if (!familyId) return [];
            const response = await fetchAPI<Role[]>(`/families/${familyId}/roles`);
            return response.data;
        },
        enabled: !!familyId
    });

    // 获取所有权限
    const { data: permissions } = useQuery<Permission[]>({
        queryKey: ['permissions'],
        queryFn: async () => {
            const response = await fetchAPI<Permission[]>('/permissions');
            return response.data;
        }
    });

    // 创建角色
    const { mutate: createRole } = useMutation({
        mutationFn: async (data: { name: string; description: string; permissions: string[] }) => {
            if (!familyId) throw new Error('No family selected');
            const response = await fetchAPI(`/families/${familyId}/roles`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('角色创建成功', 'success');
            queryClient.invalidateQueries({ queryKey: ['roles', familyId] });
        },
        onError: (error: Error) => {
            showToast(`创建角色失败: ${error.message}`, 'error');
        }
    });

    // 更新角色
    const { mutate: updateRole } = useMutation({
        mutationFn: async ({ roleId, data }: { roleId: number; data: Partial<Role> }) => {
            if (!familyId) throw new Error('No family selected');
            const response = await fetchAPI(`/families/${familyId}/roles/${roleId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            return response.data;
        },
        onSuccess: () => {
            showToast('角色更新成功', 'success');
            queryClient.invalidateQueries({ queryKey: ['roles', familyId] });
        },
        onError: (error: Error) => {
            showToast(`更新角色失败: ${error.message}`, 'error');
        }
    });

    // 删除角色
    const { mutate: deleteRole } = useMutation({
        mutationFn: async (roleId: number) => {
            if (!familyId) throw new Error('No family selected');
            await fetchAPI(`/families/${familyId}/roles/${roleId}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            showToast('角色删除成功', 'success');
            queryClient.invalidateQueries({ queryKey: ['roles', familyId] });
        },
        onError: (error: Error) => {
            showToast(`删除角色失败: ${error.message}`, 'error');
        }
    });

    return {
        roles,
        permissions,
        isLoading,
        createRole,
        updateRole,
        deleteRole
    };
} 