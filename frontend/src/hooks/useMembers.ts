/*
 * @Author: Await
 * @Date: 2025-03-15 10:50:14
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:34:47
 * @Description: 请填写简介
 */
import { useState, useEffect, useRef } from 'react';
import { Member } from '@/lib/types';
import { fetchAPI } from '@/lib/api';

export function useMembers(familyId?: string) {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const requestAttempted = useRef(false);

    useEffect(() => {
        // 重置请求状态
        if (familyId) {
            requestAttempted.current = false;
        }

        const fetchMembers = async () => {
            if (!familyId) {
                setMembers([]);
                setIsLoading(false);
                return;
            }

            // 如果已经请求过并失败，不再重复请求
            if (requestAttempted.current && error) {
                return;
            }

            try {
                setIsLoading(true);
                const url = `/families/${familyId}/members`;
                const response = await fetchAPI<Member[]>(url);
                setMembers(response.data);
                setError(null);
            } catch (err) {
                console.error('获取家庭成员失败', err);
                setError(err as Error);
                setMembers([]);
                // 标记已尝试请求
                requestAttempted.current = true;
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [familyId]);

    return { members, isLoading, error };
} 