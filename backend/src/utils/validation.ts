/*
 * @Author: Await
 * @Date: 2025-03-05 19:24:04
 * @LastEditors: Await
 * @LastEditTime: 2025-03-05 20:53:19
 * @Description: 请填写简介
 */
// 验证邮箱格式
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 验证密码强度
export function validatePassword(password: string): boolean {
    // 密码至少8个字符
    return password.length >= 8;
}

// 验证用户名
export function validateUsername(username: string): boolean {
    // 用户名长度在2-20个字符之间，只允许字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{2,20}$/;
    return usernameRegex.test(username);
}

// 验证家庭信息
export function validateFamily(name: string, description: string): string | null {
    if (!name || name.trim().length === 0) {
        return '家庭名称不能为空';
    }

    if (name.length > 50) {
        return '家庭名称不能超过50个字符';
    }

    if (description && description.length > 200) {
        return '家庭描述不能超过200个字符';
    }

    return null;
}

// 验证事务信息
export function validateTransaction(
    amount: number,
    category_id: number,
    description: string,
    date: string,
    type: 'income' | 'expense'
): string | null {
    if (!amount || isNaN(amount) || amount <= 0) {
        return '金额必须大于0';
    }

    if (!category_id || isNaN(category_id)) {
        return '请选择分类';
    }

    if (description && description.length > 200) {
        return '描述不能超过200个字符';
    }

    if (!date || isNaN(Date.parse(date))) {
        return '日期格式不正确';
    }

    if (type !== 'income' && type !== 'expense') {
        return '类型必须是收入或支出';
    }

    return null;
} 