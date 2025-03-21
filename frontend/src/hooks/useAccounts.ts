/*
 * @Author: Await
 * @Date: 2025-03-15 10:49:57
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:59:04
 * @Description: 请填写简介
 */
import { useState, useEffect, useRef } from 'react';
import { Account } from '@/lib/types';
import { fetchAPI } from '@/lib/api';
import { useAuth } from './useAuth';

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { user } = useAuth();
    const requestAttempted = useRef(false);

    useEffect(() => {
        // 重置请求状态
        if (user) {
            requestAttempted.current = false;
        }

        const fetchAccounts = async () => {
            // 如果已经请求过并失败，不再重复请求
            if (requestAttempted.current && error) {
                return;
            }

            try {
                setIsLoading(true);
                let url = '/accounts';
                // 如果有用户并且有当前家庭ID，则获取家庭的账户
                if (user?.currentFamilyId) {
                    url += `?family_id=${user.currentFamilyId}`;
                } else if (user?.id) {
                    // 否则获取用户的个人账户
                    url += `?user_id=${user.id}`;
                }
                const data = await fetchAPI<Account[]>(url);
                setAccounts(data.data);
                setError(null);
            } catch (err) {
                console.error('获取账户失败', err);
                setError(err as Error);
                // 设置空数组避免组件报错
                setAccounts([]);
                // 标记已尝试请求
                requestAttempted.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchAccounts();
        } else {
            setAccounts([]);
            setIsLoading(false);
        }
    }, [user]);

    return { accounts, isLoading, error };
}
