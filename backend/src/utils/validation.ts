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