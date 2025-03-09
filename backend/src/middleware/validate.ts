import {Request, Response, NextFunction} from 'express';
import {AnyZodObject, ZodError} from 'zod';

// 请求验证中间件
export const validateRequest = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log('验证前的请求体:', req.body);

            // 处理请求体可能是字符串的情况
            if (typeof req.body === 'string') {
                try {
                    req.body = JSON.parse(req.body);
                    console.log('解析字符串请求体为JSON:', req.body);
                } catch (e) {
                    console.error('请求体字符串解析失败:', e);
                }
            }

            // 只验证请求体
            await schema.parseAsync(req.body);

            console.log('验证通过');
            next();
        } catch (error) {
            console.error('验证失败:', error);

            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: '请求验证失败',
                    errors: error.errors
                });
            }
            return res.status(500).json({message: '服务器错误'});
        }
    };
