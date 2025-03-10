import winston from 'winston';
import path from 'path';

// 日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');

// 创建日志记录器
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // 错误日志
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        }),
        // 访问日志
        new winston.transports.File({
            filename: path.join(logDir, 'access.log'),
            level: 'info'
        }),
        // 性能日志
        new winston.transports.File({
            filename: path.join(logDir, 'performance.log'),
            level: 'info'
        }),
        // 调试日志
        new winston.transports.File({
            filename: path.join(logDir, 'debug.log'),
            level: 'debug'
        })
    ]
});

// 开发环境下同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// 访问日志中间件
export const accessLogger = (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('访问日志', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userId: req.user?.id
        });
    });

    next();
};

// 性能日志
export const logPerformance = (
    routeId: number,
    loadTime: number,
    isError: boolean,
    fromCache: boolean
) => {
    logger.info('性能日志', {
        routeId,
        loadTime,
        isError,
        fromCache,
        timestamp: new Date().toISOString()
    });
};

// 错误日志
export const logError = (
    error: Error,
    context: Record<string, any> = {}
) => {
    logger.error('错误日志', {
        message: error.message,
        stack: error.stack,
        ...context,
        timestamp: new Date().toISOString()
    });
};

// 调试日志
export const logDebug = (
    message: string,
    context: Record<string, any> = {}
) => {
    logger.debug('调试日志', {
        message,
        ...context,
        timestamp: new Date().toISOString()
    });
};

export default logger; 