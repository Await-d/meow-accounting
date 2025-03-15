/*
 * @Author: Await
 * @Date: 2025-03-15 11:42:38
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 11:43:02
 * @Description: 请填写简介
 */
/**
 * 格式化货币
 * @param amount 金额
 * @param currency 货币代码
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(amount: number, currency: string = 'CNY'): string {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date, format: 'full' | 'date' | 'time' = 'full'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (format === 'date') {
        return dateObj.toLocaleDateString('zh-CN');
    } else if (format === 'time') {
        return dateObj.toLocaleTimeString('zh-CN');
    } else {
        return dateObj.toLocaleString('zh-CN');
    }
}

/**
 * 格式化姓名（姓氏和名字的第一个字）
 * @param name 全名
 * @returns 格式化后的缩写名
 */
export function formatNameInitials(name: string): string {
    if (!name) return '';

    // 移除多余空格并分割
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
        // 只有单个名字，返回前两个字符
        return name.substring(0, 2);
    } else {
        // 有姓和名，返回姓的第一个字符和名的第一个字符
        return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
    }
} 