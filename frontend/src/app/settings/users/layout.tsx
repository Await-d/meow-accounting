/*
 * @Author: Await
 * @Date: 2025-03-13 20:22:17
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 20:22:45
 * @Description: 请填写简介
 */
"use client";

import RequireAuth from "@/components/RequireAuth";

export default function UsersLayout({
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