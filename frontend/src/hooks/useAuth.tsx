/*
 * @Author: Await
 * @Date: 2025-03-05 19:26:06
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:46:49
 * @Description: 请填写简介
 */
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { login as apiLogin, register as apiRegister, verifyGuestPassword, updateUserSettings } from '@/lib/api';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { jwtDecode } from 'jwt-decode';
import type { User, UserSettings, RouteType } from '@/lib/types';
import { RoutePermission } from '@/lib/types';
import { checkRoutePermission, getRouteComponent } from '@/config/routes';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    updateUser: (user: User) => void;
    updateSettings: (settings: UserSettings) => Promise<User>;
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
    const [isLoading, setIsLoading] = useState(false);
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
                privacy_mode: decoded.privacy_mode,
                default_route: decoded.default_route,
                permissions: decoded.permissions
            };
        } catch (error) {
            console.error('解析 token 失败:', error);
            removeToken();
            localStorage.removeItem('isGuest');
            return null;
        }
    };

    // 处理路由跳转
    const handleRouteNavigation = async (user: User) => {
        if (!user.default_route) {
            router.push('/dashboard');
            return;
        }

        try {
            // 获取用户的默认路由
            const defaultRoute = user.default_route;
            const routeType = defaultRoute.split('/')[1] as RouteType;

            // 检查路由权限
            const hasPermission = checkRoutePermission(
                routeType,
                RoutePermission.PRIVATE,
                user.id,
                user.currentFamilyId
            );

            if (!hasPermission) {
                console.warn('用户无权访问默认路由，重定向到仪表盘');
                router.push('/dashboard');
                return;
            }

            // 加载路由组件
            await getRouteComponent(defaultRoute, routeType);
            router.push(defaultRoute);
        } catch (error) {
            console.error('路由导航失败:', error);
            router.push('/dashboard');
        }
    };

    // 初始化：检查本地存储的 token
    useEffect(() => {
        const token = getToken();
        const savedIsGuest = localStorage.getItem('isGuest') === 'true';
        const path = window.location.pathname;
        const isAuthPage = path.startsWith('/auth/');
        const isPublicPage = path === '/' || path === '/about';

        if (token) {
            const parsedUser = parseAndValidateToken(token);
            if (parsedUser) {
                setUser(parsedUser);
                setIsGuest(savedIsGuest);
                // 如果已登录用户访问登录或注册页面，重定向到默认路由
                if (isAuthPage) {
                    handleRouteNavigation(parsedUser);
                }
            } else {
                // token无效或过期，重定向到登录页
                if (!isAuthPage && !isPublicPage) {
                    router.push('/auth/login');
                }
            }
        } else {
            // 没有token，且不是认证相关页面或公开页面时重定向到登录页
            if (!isAuthPage && !isPublicPage) {
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
            handleRouteNavigation(user);
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
            handleRouteNavigation(user);
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
        localStorage.removeItem('currentFamilyId'); // 清除当前家庭ID
        setUser(null);
        setIsGuest(false);
        showToast('登录已过期，请重新登录', 'error');
        router.push('/auth/login');
        console.log('登录已过期，已重定向到登录页面');
    };

    // 更新用户设置
    const updateSettings = async (settings: UserSettings) => {
        try {
            const updatedUser = await updateUserSettings(settings);
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            if (error instanceof Error) {
                showToast(error.message, 'error');
            } else {
                showToast('更新设置失败', 'error');
            }
            throw error;
        }
    };

    const contextValue: AuthContextType = {
        user,
        isGuest,
        isLoading,
        setUser,
        updateUser,
        updateSettings,
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

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 