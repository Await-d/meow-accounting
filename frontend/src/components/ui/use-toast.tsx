import React, { useCallback, useState, useEffect } from 'react';
import {
    useDisclosure,
    Modal,
    ModalContent,
    ModalBody
} from '@nextui-org/react';
import {
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Info
} from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

interface ToastState {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    title: string;
    description?: string;
    variant: ToastVariant;
}

interface ToastProps {
    title: string;
    description?: string;
    variant?: ToastVariant;
    isOpen: boolean;
    onClose: () => void;
}

// Toast通知组件
export function Toast({ title, description, variant = 'default', isOpen, onClose }: ToastProps) {
    const [icon, setIcon] = useState<React.ReactNode>(null);
    const [color, setColor] = useState<"default" | "primary" | "secondary" | "success" | "warning" | "danger">('default');

    useEffect(() => {
        switch (variant) {
            case 'success':
                setIcon(<CheckCircle className="text-success" />);
                setColor('success');
                break;
            case 'error':
                setIcon(<AlertCircle className="text-danger" />);
                setColor('danger');
                break;
            case 'warning':
                setIcon(<AlertTriangle className="text-warning" />);
                setColor('warning');
                break;
            case 'info':
                setIcon(<Info className="text-primary" />);
                setColor('primary');
                break;
            default:
                setIcon(<Info className="text-default" />);
                setColor('default');
        }
    }, [variant]);

    // 自动关闭
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            hideCloseButton
            placement="top"
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
                        y: -20,
                        opacity: 0,
                        transition: {
                            duration: 0.2,
                            ease: "easeIn",
                        },
                    },
                }
            }}
            classNames={{
                wrapper: "z-[1000]"
            }}
        >
            <ModalContent className="py-2 px-0">
                <ModalBody className="flex items-center gap-2 py-2">
                    {icon}
                    <div className="flex flex-col">
                        <span className="font-medium">{title}</span>
                        {description && <span className="text-sm text-default-500">{description}</span>}
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

// Toast钩子
export function useToast() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [toastState, setToastState] = useState<ToastState>({
        isOpen: false,
        onOpen,
        onClose,
        title: '',
        description: '',
        variant: 'default',
    });

    const toast = useCallback(
        (
            titleOrOptions: string | { title: string; description?: string; variant?: ToastVariant },
            variantOrUndefined?: ToastVariant
        ) => {
            if (typeof titleOrOptions === 'string') {
                setToastState({
                    isOpen: true,
                    onOpen,
                    onClose,
                    title: titleOrOptions,
                    description: '',
                    variant: variantOrUndefined || 'default',
                });
            } else {
                setToastState({
                    isOpen: true,
                    onOpen,
                    onClose,
                    title: titleOrOptions.title,
                    description: titleOrOptions.description || '',
                    variant: titleOrOptions.variant || 'default',
                });
            }
            onOpen();
        },
        [onOpen, onClose]
    );

    return { toast, ...toastState };
} 