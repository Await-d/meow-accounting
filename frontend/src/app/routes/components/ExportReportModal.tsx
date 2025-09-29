import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    RadioGroup,
    Radio,
    Divider,
    Select,
    SelectItem
} from '@nextui-org/react';
import { FileText, FileSpreadsheet, PieChart } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/DateRangePicker';

interface ExportReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: 'pdf' | 'csv' | 'excel') => Promise<void>;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    setDateRange: (range: { startDate: Date; endDate: Date }) => void;
}

export function ExportReportModal({
    isOpen,
    onClose,
    onExport,
    dateRange,
    setDateRange
}: ExportReportModalProps) {
    const [format, setFormat] = React.useState<'pdf' | 'csv' | 'excel'>('pdf');
    const [isLoading, setIsLoading] = React.useState(false);
    const [reportType, setReportType] = React.useState('full');

    // 处理导出
    const handleExport = async () => {
        setIsLoading(true);
        try {
            await onExport(format);
            onClose();
        } catch (error) {
            console.error('导出失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 格式选项
    const formatOptions = [
        {
            value: 'pdf',
            label: 'PDF文档',
            icon: <FileText size={16} />,
            description: '生成PDF格式的报告文档'
        },
        {
            value: 'excel',
            label: 'Excel表格',
            icon: <FileSpreadsheet size={16} />,
            description: '生成Excel格式的数据表格'
        },
        {
            value: 'csv',
            label: 'CSV数据',
            icon: <PieChart size={16} />,
            description: '生成CSV格式的原始数据'
        }
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3 className="text-lg">导出分析报告</h3>
                            <p className="text-sm text-default-500">
                                导出路由性能和访问数据分析报告
                            </p>
                        </ModalHeader>
                        <ModalBody className="space-y-6">
                            {/* 报告类型 */}
                            <div>
                                <h4 className="text-sm font-medium mb-2">报告类型</h4>
                                <RadioGroup
                                    value={reportType}
                                    onValueChange={setReportType as any}
                                >
                                    <Radio value="full">完整报告（包含所有数据和图表）</Radio>
                                    <Radio value="performance">性能报告（仅包含加载时间和错误率）</Radio>
                                    <Radio value="usage">使用报告（仅包含访问频率和分布）</Radio>
                                </RadioGroup>
                            </div>

                            <Divider />

                            {/* 日期范围 */}
                            <div>
                                <h4 className="text-sm font-medium mb-2">日期范围</h4>
                                <DateRangePicker
                                    value={dateRange}
                                    onChange={setDateRange}
                                />
                            </div>

                            <Divider />

                            {/* 导出格式 */}
                            <div>
                                <h4 className="text-sm font-medium mb-2">导出格式</h4>
                                <RadioGroup
                                    orientation="horizontal"
                                    value={format}
                                    onValueChange={setFormat as any}
                                >
                                    {formatOptions.map((option) => (
                                        <Radio
                                            key={option.value}
                                            value={option.value}
                                            description={option.description}
                                        >
                                            <div className="flex items-center gap-2">
                                                {option.icon}
                                                {option.label}
                                            </div>
                                        </Radio>
                                    ))}
                                </RadioGroup>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onClose}>
                                取消
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleExport}
                                isLoading={isLoading}
                                startContent={<FileText size={16} />}
                            >
                                导出
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
} 