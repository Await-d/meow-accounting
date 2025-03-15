'use client';

import React, { createContext, useContext, useState } from 'react';
import { toast, Toaster, ToastOptions } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastContextType = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const showToast = (message: string, type: ToastType = 'info') => {
        const options: ToastOptions = {
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

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}; 