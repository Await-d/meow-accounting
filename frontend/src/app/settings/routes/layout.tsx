/*
 * @Author: Await
 * @Date: 2025-03-09 21:00:44
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:13:25
 * @Description: 请填写简介
 */
"use client";

import RequireAuth from "@/components/RequireAuth";

export default function RoutesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequireAuth requiredRole="admin">
            {children}
        </RequireAuth>
    );
} 