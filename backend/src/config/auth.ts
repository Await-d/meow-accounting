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
    const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;

    if (!secretKey) {
        console.warn('警告: JWT_SECRET_KEY未设置，使用默认密钥');
        if (process.env.NODE_ENV === 'production') {
            throw new Error('生产环境必须设置JWT_SECRET_KEY环境变量');
        }
        return 'default_jwt_secret_key_for_development';
    }

    // 在生产环境中验证密钥强度
    if (process.env.NODE_ENV === 'production' && secretKey.length < 32) {
        throw new Error('生产环境JWT密钥长度必须至少32个字符');
    }

    return secretKey;
};

/**
 * JWT配置
 */
export const jwtConfig = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h', // 访问令牌有效期
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // 刷新令牌有效期
    algorithm: 'HS256' as const,                    // 签名算法
    issuer: process.env.JWT_ISSUER || 'meow-accounting', // 令牌签发者
};

/**
 * 密码哈希配置
 */
export const passwordConfig = {
    saltRounds: 10, // bcrypt盐轮数
}; 