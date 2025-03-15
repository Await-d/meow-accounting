/*
 * @Author: Await
 * @Date: 2025-03-15 15:02:50
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 15:02:50
 * @Description: 认证配置
 */
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 获取JWT密钥
 */
export const getSecretKey = (): string => {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
        console.warn('警告: JWT_SECRET_KEY未设置，使用默认密钥');
        return 'default_jwt_secret_key';
    }

    return secretKey;
};

/**
 * JWT配置
 */
export const jwtConfig = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // 令牌有效期
    algorithm: 'HS256' as const,                    // 签名算法
};

/**
 * 密码哈希配置
 */
export const passwordConfig = {
    saltRounds: 10, // bcrypt盐轮数
}; 