'use client';

import { createContext, useContext } from 'react';
import { Modal, ModalContent, ModalBody } from '@nextui-org/react';
import { useToast as useToastHook } from '@/hooks/useToast';
import type { ToastType } from '@/hooks/useToast';

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
    const toast = useToastHook();

    const getColorClass = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-success-500';
            case 'error':
                return 'bg-danger-500';
            case 'warning':
                return 'bg-warning-500';
            default:
                return 'bg-primary-500';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            default:
                return 'ℹ';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast: toast.showToast }}>
            {children}
            <Modal
                isOpen={toast.isOpen}
                onClose={toast.onClose}
                hideCloseButton
                className="bg-transparent shadow-none fixed top-4 right-4 m-0"
                size="sm"
                placement="top"
                motionProps={{
                    variants: {
                        enter: {
                            x: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.3,
                                ease: "easeOut"
                            }
                        },
                        exit: {
                            x: 20,
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: "easeIn"
                            }
                        }
                    }
                }}
            >
                <ModalContent>
                    <ModalBody className={`${getColorClass()} text-white rounded-lg p-3 flex items-center gap-2`}>
                        <span className="text-lg">{getIcon()}</span>
                        <span>{toast.message}</span>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </ToastContext.Provider>
    );
}