import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import { Transaction, CreateTransactionData } from '@/lib/types';
import { handleQueryError } from '@/lib/api';
import { APIError } from '@/lib/types';

export function useTransactions(familyId?: string | number) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { showToast } = useToast();
    const requestAttempted = useRef(false);
    const hasError = useRef(false);

    useEffect(() => {
        if (familyId) {
            requestAttempted.current = false;
            hasError.current = false;
        }

        const fetchTransactions = async () => {
            if (!familyId) {
                setTransactions([]);
                setIsLoading(false);
                return;
            }

            if (requestAttempted.current && hasError.current) {
                return;
            }

            try {
                setIsLoading(true);
                requestAttempted.current = true;

                const response = await fetchAPI<Transaction[]>(`/families/${familyId}/transactions`);
                setTransactions(response.data);
                setError(null);
                hasError.current = false;
            } catch (err) {
                console.error('获取交易记录失败', err);
                showToast && showToast(handleQueryError(err as Error, '获取交易记录失败'), 'error');
                setError(err as Error);
                setTransactions([]);
                hasError.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        if (familyId && (!requestAttempted.current || !hasError.current)) {
            fetchTransactions();
        } else if (!familyId) {
            setTransactions([]);
            setIsLoading(false);
        }
    }, [familyId, showToast]);

    return { transactions, isLoading, error };
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (transaction: CreateTransactionData) => {
            const response = await fetchAPI<Transaction>('/transactions', {
                method: 'POST',
                body: JSON.stringify(transaction),
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            showToast('创建成功', 'success');
        },
        onError: (error: any) => {
            console.error('创建交易失败:', error);
            showToast(handleQueryError(error, '创建交易失败'), 'error');
        }
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (transaction: Transaction) => {
            const response = await fetchAPI<Transaction>(`/transactions/${transaction.id}`, {
                method: 'PUT',
                body: JSON.stringify(transaction),
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            showToast('更新成功', 'success');
        },
        onError: (error: any) => {
            console.error('更新交易失败:', error);
            showToast(handleQueryError(error, '更新交易失败'), 'error');
        }
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (id: number | string) => {
            await fetchAPI<void>(`/transactions/${id}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
            showToast('删除成功', 'success');
        },
        onError: (error: APIError) => {
            if (error.status === 401) {
                showToast('请先登录', 'error');
            } else {
                showToast('删除失败', 'error');
            }
        },
    });
}

export function useExportTransactions() {
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
            const params = new URLSearchParams();
            params.append('startDate', startDate);
            params.append('endDate', endDate);

            // 动态获取API基础URL
            const getApiBaseUrl = () => {
                if (process.env.NEXT_PUBLIC_API_URL) {
                    return process.env.NEXT_PUBLIC_API_URL;
                }
                if (typeof window !== 'undefined') {
                    const { protocol, hostname, port } = window.location;
                    // 生产环境使用相对路径
                    if (port === '80' || port === '443' || port === '') {
                        return '/api';
                    }
                    // 开发环境
                    if (port === '3000') {
                        return `${protocol}//${hostname}:3001/api`;
                    }
                    return '/api';
                }
                return '/api';
            };

            // For blob exports, we need to use fetch directly
            const url = `${getApiBaseUrl()}/transactions/export?${params.toString()}`;
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/octet-stream',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!response.ok) {
                throw new Error('导出失败');
            }

            const blob = await response.blob();
            // 创建下载链接
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            const filename = `交易记录_${startDate}_${endDate}.csv`;

            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // 清理
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return blob;
        },
        onSuccess: () => {
            showToast('导出成功', 'success');
        },
        onError: (error: Error) => {
            console.error('导出失败:', error);
            showToast('导出失败', 'error');
        }
    });
}

export function useImportTransactions() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await fetchAPI<{ message: string }>('/transactions/import', {
                method: 'POST',
                body: formData,
                headers: {
                    // 不设置Content-Type，让浏览器自动处理multipart/form-data
                    Accept: 'application/json',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
            showToast('导入成功', 'success');
        },
        onError: (error: Error) => {
            console.error('导入失败:', error);
            showToast('导入失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
        }
    });
} 