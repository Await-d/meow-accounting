/*
 * @Author: Await
 * @Date: 2025-03-05 19:44:25
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 19:44:53
 * @Description: 请填写简介
 */
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthContextType {
    user: ReturnType<typeof useAuth>['user'];
    loading: boolean;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
} 