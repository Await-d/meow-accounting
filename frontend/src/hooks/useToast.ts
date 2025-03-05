import { useToast as useNextUIToast } from '@nextui-org/react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

export function useToast() {
    const { toast } = useNextUIToast();

    const showToast = (message: string, type: ToastType = 'info') => {
        toast({
            description: message,
            type,
            duration: 3000,
        });
    };

    return { showToast };
} 