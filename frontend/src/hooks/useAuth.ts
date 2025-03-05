/*
 * @Author: Await
 * @Date: 2025-03-05 19:26:06
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 22:08:00
 * @Description: 请填写简介
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { login as apiLogin, register as apiRegister } from '@/lib/api';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/lib/types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { showToast } = useToast();

    // 从 token 中解析用户信息
    const parseUser = (token: string): User | null => {
        try {
            const decoded = jwtDecode<User>(token);
            return {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role
            };
        } catch (error) {
            console.error('解析 token 失败:', error);
            return null;
        }
    };

    // 初始化：检查本地存储的 token
    useEffect(() => {
        const token = getToken();
        if (token) {
            const parsedUser = parseUser(token);
            setUser(parsedUser);
        }
        setLoading(false);
    }, []);

    // 登录
    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { token, user } = await apiLogin({ email, password });
            setToken(token);
            setUser(user);
            showToast('登录成功', 'success');
            router.push('/');
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            } else {
                showToast('登录失败', 'error');
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 注册
    const register = async (data: { username: string; email: string; password: string }) => {
        try {
            setLoading(true);
            const { token, user } = await apiRegister(data);
            setToken(token);
            setUser(user);
            showToast('注册成功', 'success');
            router.push('/');
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            } else {
                showToast('注册失败', 'error');
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 登出
    const logout = () => {
        removeToken();
        setUser(null);
        router.push('/auth/login');
    };

    // 检查是否是管理员
    const isAdmin = () => user?.role === 'admin';

    return {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin
    };
} 