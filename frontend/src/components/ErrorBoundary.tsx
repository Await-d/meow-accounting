import React from 'react';
import { Card, CardBody, Button } from '@nextui-org/react';
import { APIError } from '@/lib/types';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('组件错误:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 默认错误UI
            return (
                <Card>
                    <CardBody className="text-center py-8">
                        <h3 className="text-lg font-semibold mb-2">
                            {this.state.error instanceof APIError
                                ? '加载数据失败'
                                : '出现了一些问题'}
                        </h3>
                        <p className="text-default-500 mb-4">
                            {this.state.error?.message || '请稍后再试'}
                        </p>
                        <Button
                            color="primary"
                            onPress={() => window.location.reload()}
                        >
                            刷新页面
                        </Button>
                    </CardBody>
                </Card>
            );
        }

        return this.props.children;
    }
} 