/*
 * @Author: Await
 * @Date: 2025-03-10 10:00:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-10 10:00:00
 * @Description: 工具函数
 */

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @param format 格式化模式，默认为 'YYYY-MM-DD HH:mm'
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string, format: string = 'YYYY-MM-DD HH:mm'): string {
    if (!dateString) return '';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 格式化金额
 * @param amount 金额
 * @param decimals 小数位数，默认为2
 * @param currency 货币符号，默认为'¥'
 * @returns 格式化后的金额字符串
 */
export function formatAmount(amount: number, decimals: number = 2, currency: string = '¥'): string {
    return `${currency}${amount.toFixed(decimals)}`;
}

/**
 * 截断文本
 * @param text 文本
 * @param maxLength 最大长度，默认为50
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number = 50): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * 生成随机ID
 * @param length ID长度，默认为8
 * @returns 随机ID
 */
export function generateRandomId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item)) as unknown as T;
    }

    const result = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = deepClone(obj[key]);
        }
    }

    return result;
}

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间，默认为300ms
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number = 300
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function (...args: Parameters<T>): void {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 限制时间，默认为300ms
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 300
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return function (...args: Parameters<T>): void {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
} 