import {Request, Response, NextFunction} from 'express';

// 自定义错误类
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

// 通用类型
export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

// 错误处理中间件
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            code: err.statusCode,
            message: err.message
        });
    }

    // 处理数据库错误
    if (err.message.includes('SQLITE_CONSTRAINT')) {
        return res.status(400).json({
            code: 400,
            message: '数据约束错误'
        });
    }

    // 处理未知错误
    console.error('未知错误:', err);
    res.status(500).json({
        code: 500,
        message: '服务器内部错误'
    });
};

// 404错误处理
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const err = new AppError(404, '请求的资源不存在');
    next(err);
};

// 异步错误处理包装器
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};
