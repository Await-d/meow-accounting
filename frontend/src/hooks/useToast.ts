/*
 * @Author: Await
 * @Date: 2025-03-05 19:27:32
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 21:57:12
 * @Description: 请填写简介
 */
import { useDisclosure } from '@nextui-org/react';
import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
    message: string;
    type: ToastType;
}

export function useToast() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [state, setState] = useState<ToastState>({ message: '', type: 'info' });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setState({ message, type });
        onOpen();
        setTimeout(onClose, 3000);
    }, [onOpen, onClose]);

    return {
        showToast,
        isOpen,
        onClose,
        message: state.message,
        type: state.type,
    };
} 