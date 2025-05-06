import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
    Accordion,
    AccordionItem
} from '@nextui-org/react';
import { Zap, AlertTriangle, Clock, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OptimizationSuggestion {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'performance' | 'caching' | 'error' | 'other';
    impact: string;
}

interface RouteOptimizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    routeId: number;
    fetchSuggestions: (routeId: number) => Promise<OptimizationSuggestion[]>;
}

export function RouteOptimizationModal({
    isOpen,
    onClose,
    routeId,
    fetchSuggestions
}: RouteOptimizationModalProps) {
    // 查询优化建议
    const { data: suggestions, isLoading } = useQuery({
        queryKey: ['routeOptimization', routeId],
        queryFn: () => fetchSuggestions(routeId),
        enabled: isOpen && routeId > 0,
    });

    // 获取优化建议的图标
    const getSuggestionIcon = (category: string) => {
        switch (category) {
            case 'performance':
                return <Zap className="text-warning" size={18} />;
            case 'error':
                return <AlertTriangle className="text-danger" size={18} />;
            case 'caching':
                return <Database className="text-success" size={18} />;
            default:
                return <Clock className="text-primary" size={18} />;
        }
    };

    // 获取优先级标签颜色
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'danger';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3 className="text-lg">路由优化建议</h3>
                            <p className="text-sm text-default-500">
                                基于性能数据为您推荐的优化方案
                            </p>
                        </ModalHeader>
                        <ModalBody>
                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Spinner label="加载优化建议中..." />
                                </div>
                            ) : !suggestions || suggestions.length === 0 ? (
                                <div className="text-center py-8">
                                    <p>暂无优化建议</p>
                                    <p className="text-sm text-default-500">该路由性能状况良好</p>
                                </div>
                            ) : (
                                <Accordion variant="bordered">
                                    {suggestions.map((suggestion) => (
                                        <AccordionItem
                                            key={suggestion.id}
                                            title={
                                                <div className="flex items-center gap-2">
                                                    {getSuggestionIcon(suggestion.category)}
                                                    <span>{suggestion.title}</span>
                                                </div>
                                            }
                                            subtitle={
                                                <span
                                                    className={`text-${getPriorityColor(suggestion.priority)} text-xs`}
                                                >
                                                    {suggestion.priority === 'high' ? '高优先级' :
                                                        suggestion.priority === 'medium' ? '中优先级' : '低优先级'}
                                                </span>
                                            }
                                        >
                                            <div className="space-y-2 px-2">
                                                <p>{suggestion.description}</p>

                                                <div className="text-sm">
                                                    <strong>预期影响：</strong> {suggestion.impact}
                                                </div>
                                            </div>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" variant="light" onPress={onClose}>
                                关闭
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
} 