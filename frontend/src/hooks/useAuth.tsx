/*
 * @Author: Await
 * @Date: 2025-03-05 19:26:06
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 20:52:03
 * @Description: 请填写简介
 */
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { login as apiLogin, register as apiRegister, verifyGuestPassword } from '@/lib/api';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    setUser: (user: User | null) => void;
    updateUser: (user: User) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { username: string; email: string; password: string }) => Promise<void>;
    logout: () => void;
    enterGuestMode: (password: string) => Promise<void>;
    exitGuestMode: () => void;
    handleUnauthorized: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    // 更新用户信息
    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    // 从 token 中解析用户信息并验证
    const parseAndValidateToken = (token: string): User | null => {
        try {
            const decoded = jwtDecode<{ exp: number } & User>(token);

            // 检查token是否过期
            const now = Date.now() / 1000;
            if (decoded.exp && decoded.exp < now) {
                removeToken();
                localStorage.removeItem('isGuest');
                return null;
            }

            return {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role,
                privacy_mode: decoded.privacy_mode
            };
        } catch (error) {
            console.error('解析 token 失败:', error);
            removeToken();
            localStorage.removeItem('isGuest');
            return null;
        }
    };

    // 初始化：检查本地存储的 token
    useEffect(() => {
        const token = getToken();
        const savedIsGuest = localStorage.getItem('isGuest') === 'true';
        const path = window.location.pathname;
        const isAuthPage = path.startsWith('/auth/');

        if (token) {
            const parsedUser = parseAndValidateToken(token);
            if (parsedUser) {
                setUser(parsedUser);
                setIsGuest(savedIsGuest);
                // 如果已登录用户访问登录或注册页面，重定向到首页
                if (isAuthPage) {
                    router.push('/');
                }
            } else {
                // token无效或过期，重定向到登录页
                if (!isAuthPage) {
                    router.push('/auth/login');
                }
            }
        } else {
            // 没有token，且不是认证相关页面时重定向到登录页
            if (!isAuthPage) {
                router.push('/auth/login');
            }
        }
    }, [router]);

    // 登录
    const login = async (email: string, password: string) => {
        try {
            const { token, user } = await apiLogin({ email, password });
            setToken(token);
            setUser(user);
            setIsGuest(false);
            localStorage.setItem('isGuest', 'false');
            showToast('登录成功', 'success');
            router.push('/');
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            } else {
                showToast('登录失败', 'error');
            }
            throw error;
        }
    };

    // 注册
    const register = async (data: { username: string; email: string; password: string }) => {
        try {
            const { token, user } = await apiRegister(data);
            setToken(token);
            setUser(user);
            setIsGuest(false);
            localStorage.setItem('isGuest', 'false');
            showToast('注册成功', 'success');
            router.push('/');
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            } else {
                showToast('注册失败', 'error');
            }
            throw error;
        }
    };

    // 登出
    const logout = () => {
        removeToken();
        localStorage.removeItem('isGuest');
        setUser(null);
        setIsGuest(false);
        router.push('/auth/login');
    };

    // 检查是否是管理员
    const isAdmin = () => user?.role === 'admin';

    // 进入访客模式
    const enterGuestMode = async (password: string) => {
        try {
            await verifyGuestPassword(password);
            setIsGuest(true);
            localStorage.setItem('isGuest', 'true');
        } catch (error) {
            throw error;
        }
    };

    // 退出访客模式
    const exitGuestMode = () => {
        setIsGuest(false);
        localStorage.removeItem('isGuest');
    };

    // 处理401错误
    const handleUnauthorized = () => {
        removeToken();
        localStorage.removeItem('isGuest');
        setUser(null);
        setIsGuest(false);
        showToast('登录已过期，请重新登录', 'error');
        router.push('/auth/login');
    };

    const contextValue: AuthContextType = {
        user,
        isGuest,
        setUser,
        updateUser,
        login,
        register,
        logout,
        enterGuestMode,
        exitGuestMode,
        handleUnauthorized
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 