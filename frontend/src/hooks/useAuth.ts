/*
 * @Author: Await
 * @Date: 2025-03-05 19:26:06
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:26:11
 * @Description: 请填写简介
 */
import { useState, useEffect, createContext, useContext } from 'react';
import { User, LoginData, RegisterData } from '@/lib/types';
import { login, register } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // 从 localStorage 恢复用户会话
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }

        setLoading(false);
    }, []);

    const handleLogin = async (data: LoginData) => {
        try {
            setError(null);
            const response = await login(data);
            setUser(response.user);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : '登录失败');
            throw err;
        }
    };

    const handleRegister = async (data: RegisterData) => {
        try {
            setError(null);
            const response = await register(data);
            setUser(response.user);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : '注册失败');
            throw err;
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
    };

    return (
        <AuthContext.Provider
            value= {{
        user,
            loading,
            error,
            login: handleLogin,
                register: handleRegister,
                    logout: handleLogout,
            }
}
        >
    { children }
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