'use client';

'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useRoute } from '@/hooks/useRoute';
import TransactionList from '@/components/TransactionList';
import { TransactionFilter } from '@/components/TransactionFilter';
import { Plus, Filter, Search, Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TransactionFilter as FilterType } from '@/lib/types';
import PageLayout from '@/components/PageLayout';

export default function TransactionsPage() {
    const { user } = useAuth();
    const { currentRoute } = useRoute();
    const router = useRouter();
    const [showFilter, setShowFilter] = useState(false);
    const [filter, setFilter] = useState<FilterType>({});
    const [searchText, setSearchText] = useState('');

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchText(value);
        // 这里可以根据需要实现实时搜索或按回车搜索
    };

    // 处理添加新交易
    const handleAddTransaction = () => {
        router.push('/transactions/new');
    };

    // 应用过滤器
    const applyFilter = (newFilter: FilterType) => {
        setFilter(newFilter);
    };

    const headerActions = (
        <div className="flex flex-wrap gap-2">
            <Input
                classNames={{
                    base: 'w-full sm:max-w-[12rem]',
                    inputWrapper: 'h-9',
                }}
                placeholder="搜索交易..."
                size="sm"
                startContent={<Search size={16} />}
                value={searchText}
                onValueChange={handleSearch}
            />
            <Button
                variant="flat"
                size="sm"
                onPress={() => setShowFilter(!showFilter)}
                startContent={<Filter size={16} />}
            >
                过滤
            </Button>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="flat" size="sm">
                        导入/导出
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="导入导出选项">
                    <DropdownItem key="import" startContent={<Upload size={16} />}>
                        导入交易
                    </DropdownItem>
                    <DropdownItem key="export" startContent={<Download size={16} />}>
                        导出交易
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
            <Button
                color="primary"
                size="sm"
                onPress={handleAddTransaction}
                startContent={<Plus size={16} />}
            >
                添加交易
            </Button>
        </div>
    );

    return (
        <PageLayout
            title={currentRoute?.name || '交易记录'}
            description="集中管理所有收入与支出，支持搜索、过滤与导入导出。"
            actions={headerActions}
            backgroundVariant="minimal"
        >
            <Card className="border border-default-100 bg-background/60 backdrop-blur-md">
                <TransactionFilter
                    isOpen={showFilter}
                    onClose={() => setShowFilter(false)}
                    onApply={applyFilter}
                />
                <CardBody className="pt-4">
                    <TransactionList />
                </CardBody>
            </Card>
        </PageLayout>
    );
}
