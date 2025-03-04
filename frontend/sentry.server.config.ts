/*
 * @Author: Await
 * @Date: 2025-03-04 19:21:04
 * @LastEditors: Await
 * @LastEditTime: 2025-03-04 19:21:28
 * @Description: 请填写简介
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
}); 