// 获取 token
export function getToken(): string | null {
    return localStorage.getItem('token');
}

// 设置 token
export function setToken(token: string): void {
    localStorage.setItem('token', token);
}

// 移除 token
export function removeToken(): void {
    localStorage.removeItem('token');
} 