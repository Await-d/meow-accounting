import * as Sentry from '@sentry/nextjs';
import { getCurrentHub } from '@sentry/hub';

// 性能监控
export function trackPerformance(name: string, data?: Record<string, any>) {
    const transaction = getCurrentHub().startTransaction({
        name,
        op: 'performance',
    });

    if (!transaction) return { finish: () => { } };

    return {
        finish: (status: 'ok' | 'error' = 'ok') => {
            transaction.setStatus(status);
            if (data) {
                Sentry.addBreadcrumb({
                    category: 'performance',
                    message: name,
                    level: 'info',
                    data
                });
            }
            transaction.finish();
        },
    };
}

// 错误追踪
export function trackError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
        extra: context,
    });
}

// 用户行为追踪
export function trackEvent(name: string, data?: Record<string, any>) {
    Sentry.captureEvent({
        message: name,
        level: 'info',
        extra: data,
    });
}

// API请求监控
export function trackAPIRequest(
    url: string,
    method: string,
    duration: number,
    status: number,
    error?: Error
) {
    const transaction = getCurrentHub().startTransaction({
        name: `${method} ${url}`,
        op: 'http.request',
    });

    if (!transaction) return;

    Sentry.addBreadcrumb({
        category: 'http',
        message: `${method} ${url}`,
        level: 'info',
        data: {
            url,
            method,
            duration,
            status
        }
    });

    if (error) {
        transaction.setStatus('error');
        Sentry.addBreadcrumb({
            category: 'error',
            message: error.message,
            level: 'error',
            data: {
                stack: error.stack
            }
        });
    } else {
        transaction.setStatus('ok');
    }

    transaction.finish();
}

// 组件性能监控
export function trackComponentRender(
    componentName: string,
    renderTime: number,
    props?: Record<string, any>
) {
    const transaction = getCurrentHub().startTransaction({
        name: `render ${componentName}`,
        op: 'ui.render',
    });

    if (!transaction) return;

    const breadcrumbData: Record<string, any> = { renderTime };
    if (props) {
        Object.entries(props).forEach(([key, value]) => {
            breadcrumbData[`prop_${key}`] = value;
        });
    }

    Sentry.addBreadcrumb({
        category: 'ui',
        message: `Render ${componentName}`,
        level: 'info',
        data: breadcrumbData
    });

    transaction.finish();
}

// 用户会话追踪
export function trackUserSession(userId: string, data?: Record<string, any>) {
    Sentry.setUser({
        id: userId,
        ...data,
    });
}

// 清除用户会话
export function clearUserSession() {
    Sentry.setUser(null);
}

// 设置全局上下文
export function setGlobalContext(name: string, data: Record<string, any>) {
    Sentry.setContext(name, data);
}

// 清除全局上下文
export function clearGlobalContext(name: string) {
    Sentry.setContext(name, null);
}

// 性能指标监控
export function trackWebVitals(metric: {
    name: string;
    value: number;
    id: string;
}) {
    Sentry.captureEvent({
        message: `Web Vital: ${metric.name}`,
        level: 'info',
        extra: {
            id: metric.id,
            value: metric.value,
        },
    });
} 