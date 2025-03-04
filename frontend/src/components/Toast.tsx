/*
 * @Author: Await
 * @Date: 2025-03-04 19:13:33
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:22:52
 * @Description: 请填写简介
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { Modal, ModalContent } from '@nextui-org/react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
    open: boolean;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
    showToast: () => { },
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<ToastState>({
        open: false,
        message: '',
        type: 'info',
    });

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToast({
            open: true,
            message,
            type,
        });
        // 3秒后自动关闭
        setTimeout(() => {
            setToast(prev => ({ ...prev, open: false }));
        }, 3000);
    }, []);

    const handleClose = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    const getColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'success';
            case 'error':
                return 'danger';
            case 'warning':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Modal
                isOpen={toast.open}
                onClose={handleClose}
                hideCloseButton
                placement="bottom"
                classNames={{
                    wrapper: "items-end",
                    base: "mb-4 mx-auto max-w-[90vw] min-w-[200px]",
                }}
                motionProps={{
                    variants: {
                        enter: {
                            y: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.3,
                                ease: "easeOut",
                            },
                        },
                        exit: {
                            y: 20,
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: "easeIn",
                            },
                        },
                    }
                }}
            >
                <ModalContent>
                    <div className={`p-3 text-center text-${getColor(toast.type)}`}>
                        {toast.message}
                    </div>
                </ModalContent>
            </Modal>
        </ToastContext.Provider>
    );
} 