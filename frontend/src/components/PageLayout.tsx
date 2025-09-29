'use client';

import { ReactNode } from 'react';
import BackgroundEffect from '@/components/BackgroundEffect';

type BackgroundVariant = 'default' | 'minimal' | 'none';
type MaxWidth = 'lg' | 'xl' | 'full';
type Padding = 'sm' | 'md' | 'lg';

interface PageLayoutProps {
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    backgroundVariant?: BackgroundVariant;
    maxWidth?: MaxWidth;
    padding?: Padding;
    contentClassName?: string;
    headerClassName?: string;
}

const containerWidths: Record<MaxWidth, string> = {
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
    full: 'w-full max-w-none',
};

const paddingMap: Record<Padding, string> = {
    sm: 'py-6',
    md: 'py-10',
    lg: 'py-16',
};

export function PageLayout({
    title,
    description,
    actions,
    children,
    backgroundVariant = 'minimal',
    maxWidth = 'xl',
    padding = 'md',
    contentClassName = '',
    headerClassName = '',
}: PageLayoutProps) {
    const containerClassNames = [
        'relative',
        'mx-auto',
        'w-full',
        'px-4',
        containerWidths[maxWidth],
        paddingMap[padding],
        contentClassName,
    ]
        .filter(Boolean)
        .join(' ');

    const showHeader = title || description || actions;

    return (
        <main className="relative min-h-screen overflow-hidden">
            {backgroundVariant !== 'none' && (
                <BackgroundEffect variant={backgroundVariant === 'default' ? 'default' : 'minimal'} />
            )}

            <div className={containerClassNames}>
                {showHeader && (
                    <div
                        className={[
                            'mb-8',
                            'flex flex-col gap-4',
                            'sm:flex-row sm:items-center sm:justify-between',
                            headerClassName,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        <div className="space-y-1">
                            {title && <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>}
                            {description && (
                                <p className="max-w-2xl text-base text-default-500 md:text-lg">
                                    {description}
                                </p>
                            )}
                        </div>
                        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
                    </div>
                )}

                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </main>
    );
}

export default PageLayout;
