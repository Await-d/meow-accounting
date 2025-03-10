import { z } from 'zod';

// 外观设置验证
export const appearanceSchema = z.object({
    fontSize: z.number().min(12).max(24),
    animationSpeed: z.number().min(0).max(500),
    density: z.enum(['comfortable', 'compact', 'spacious'])
});

// 性能设置验证
export const performanceSchema = z.object({
    prefetch: z.boolean(),
    cacheSize: z.number().min(0).max(200),
    reducedAnimations: z.boolean()
});

// 通知设置验证
export const notificationsSchema = z.object({
    email: z.boolean(),
    push: z.boolean(),
    desktop: z.boolean(),
    summary: z.enum(['daily', 'weekly', 'never'])
});

// 用户设置验证
export const userSettingsSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string().min(2).max(10),
    appearance: appearanceSchema,
    performance: performanceSchema,
    notifications: notificationsSchema
});

// 更新设置验证
export const updateSettingsSchema = userSettingsSchema.partial(); 