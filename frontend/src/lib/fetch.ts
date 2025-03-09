/*
 * @Author: Await
 * @Date: 2025-03-09 20:22:52
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 21:12:06
 * @Description: 请填写简介
 */
import { APIError } from './types';

const BASE_URL = 'http://localhost:3001';

interface FetchOptions extends RequestInit {
    body?: any;
}

export async function fetchApi<T>(url: string, options: FetchOptions = {}): Promise<T> {
    // 添加默认headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 如果有body，转换为JSON字符串
    if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
    }

    // 发送请求
    const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include', // 包含cookies
    });

    // 如果响应不成功，抛出错误
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new APIError(response.status, error.message || `HTTP error! status: ${response.status}`);
    }

    // 如果响应是204 No Content，返回null
    if (response.status === 204) {
        return null as T;
    }

    // 解析响应
    try {
        const data = await response.json();
        return data as T;
    } catch (error) {
        throw new APIError(500, 'Failed to parse response');
    }
} 