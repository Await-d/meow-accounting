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