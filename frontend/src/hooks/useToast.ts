/*
 * @Author: Await
 * @Date: 2025-03-05 19:27:32
 * @LastEditors: Await
 * @LastEditTime: 2025-03-14 18:46:20
 * @Description: 请填写简介
 */
/*
 * @Author: Await
 * @Date: 2025-03-05 19:27:32
 * @LastEditors: Await
 * @LastEditTime: 2025-03-07 21:57:12
 * @Description: 请填写简介
 */
import { toast, ToastOptions } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export function useToast() {
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

    return { showToast };
} 