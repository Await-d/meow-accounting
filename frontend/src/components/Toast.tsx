/*
 * @Author: Await
 * @Date: 2025-03-04 19:13:33
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:58:18
 * @Description: 请填写简介
 */
'use client';

import { createContext, useContext } from 'react';
import { toast, Toaster } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const showToast = (message: string, type: ToastType = 'info') => {
        const options = {
            duration: 3000,
            style: {
                padding: '16px',
                borderRadius: '8px',
            },
        };

        switch (type) {
            case 'success':
                toast.success(message, options);
                break;
            case 'error':
                toast.error(message, options);
                break;
            case 'warning':
                toast(message, {
                    ...options,
                    icon: '⚠️',
                });
                break;
            case 'info':
            default:
                toast(message, {
                    ...options,
                    icon: 'ℹ️',
                });
                break;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toaster position="top-center" />
        </ToastContext.Provider>
    );
}