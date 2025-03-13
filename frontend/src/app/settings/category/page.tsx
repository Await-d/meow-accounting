'use client';

import { useState, useMemo } from 'react';
import {
    Card,
    CardBody,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Select,
    SelectItem,
    Chip,
} from '@nextui-org/react';
import { PlusIcon, PencilIcon, TrashIcon, InboxIcon } from '@heroicons/react/24/outline';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { Category } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import Skeleton from '@/components/Skeleton';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useFamily } from '@/hooks/useFamily';
import Link from 'next/link';

export default function CategoryPage() {
    const { categories, defaultCategories, customCategories, isLoading, error } = useCategories();
    const { mutate: createCategory } = useCreateCategory();
    const { mutate: updateCategory } = useUpdateCategory();
    const { mutate: deleteCategory } = useDeleteCategory();

    // 使用单独的状态管理模态框的显示状态，避免使用useDisclosure可能存在的问题
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<Partial<Category>>({
        name: '',
        icon: '',
        type: 'expense'
    });
    const { showToast } = useToast();
    const { user, isGuest } = useAuth();
    const { families = [], currentFamily, setCurrentFamily } = useFamily();

    // 检查是否是管理员
    const isAdmin = useMemo(() => {
        if (!user) return false;
        return user.role === 'admin' || user.role === 'owner';
    }, [user]);

    // 只有管理员可以编辑默认分类
    const canEditDefaultCategory = isAdmin;

    // 用户可以编辑自己家庭的分类
    const canEditCustomCategory = true;

    // 构建表头列
    const columns = useMemo(() => {
        const cols = [
            { key: 'icon', label: '图标' },
            { key: 'name', label: '名称' },
            { key: 'type', label: '类型' },
            { key: 'actions', label: '操作' }
        ];

        return cols;
    }, [isAdmin]);

    // 构建自定义分类表头列
    const customColumns = useMemo(() => [
        { key: 'icon', label: '图标' },
        { key: 'name', label: '名称' },
        { key: 'type', label: '类型' },
        { key: 'actions', label: '操作' }
    ], []);

    console.log('分类数据:', categories);
    console.log('默认分类:', defaultCategories);
    console.log('自定义分类:', customCategories);
    console.log('用户信息:', user);

    const handleSubmit = () => {
        if (!formData.name || !formData.icon || !formData.type) {
            showToast('请填写完整信息', 'error');
            return;
        }

        if (selectedCategory) {
            // 默认分类只有管理员可以修改
            if (selectedCategory.is_default && !isAdmin) {
                showToast('只有管理员可以修改默认分类', 'error');
                return;
            }

            updateCategory({
                ...selectedCategory,
                name: formData.name,
                icon: formData.icon,
                type: formData.type as 'income' | 'expense'
            });
        } else {
            if (!currentFamily && !formData.is_default) {
                showToast('请先选择一个家庭', 'error');
                return;
            }

            // 创建默认分类需要管理员权限
            if (formData.is_default && !isAdmin) {
                showToast('只有管理员可以创建默认分类', 'error');
                return;
            }

            // 创建分类
            if (formData.name && formData.icon && formData.type) {
                createCategory({
                    name: formData.name,
                    icon: formData.icon,
                    type: formData.type,
                    is_default: formData.is_default || false
                });
            } else {
                showToast('请填写完整信息', 'error');
            }
        }

        setIsFormOpen(false);
        setSelectedCategory(null);
        setFormData({ name: '', icon: '', type: 'expense' });
    };

    const handleEdit = (category: Category) => {
        console.log('handleEdit被调用，category:', category);
        if (isGuest) {
            showToast('访客模式下无法编辑', 'error');
            return;
        }

        // 默认分类只有管理员可以编辑
        if (category.is_default && !isAdmin) {
            showToast('只有管理员可以修改默认分类', 'error');
            return;
        }

        setSelectedCategory(category);
        setFormData(category);
        console.log('准备打开模态框');
        setIsFormOpen(true);
        console.log('模态框应该已打开');
    };

    const handleDelete = (category: Category) => {
        console.log('handleDelete被调用，category:', category);
        if (isGuest) {
            showToast('访客模式下无法删除', 'error');
            return;
        }

        // 默认分类只有管理员可以删除
        if (category.is_default && !isAdmin) {
            showToast('只有管理员可以删除默认分类', 'error');
            return;
        }

        setSelectedCategory(category);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedCategory) {
            deleteCategory(selectedCategory);
        }
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
    };

    // 渲染单元格（默认分类）
    const renderCell = (category: Category, columnKey: string) => {
        switch (columnKey) {
            case 'icon':
                return <div className="text-xl">{category.icon}</div>;
            case 'name':
                return <div className="font-medium">{category.name}</div>;
            case 'type':
                return (
                    <Chip
                        color={category.type === 'expense' ? 'danger' : 'success'}
                        variant="flat"
                        size="sm"
                        className="capitalize"
                    >
                        {category.type === 'expense' ? '支出' : '收入'}
                    </Chip>
                );
            case 'actions':
                // 只有管理员可以编辑和删除默认分类
                if (!isAdmin) return null;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEdit(category)}
                            className="rounded-full"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDelete(category)}
                            className="rounded-full"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    // 渲染自定义分类单元格
    const renderCustomCell = (category: Category, columnKey: string) => {
        switch (columnKey) {
            case 'icon':
                return <div className="text-xl">{category.icon}</div>;
            case 'name':
                return <div className="font-medium">{category.name}</div>;
            case 'type':
                return (
                    <Chip
                        color={category.type === 'expense' ? 'danger' : 'success'}
                        variant="flat"
                        size="sm"
                        className="capitalize"
                    >
                        {category.type === 'expense' ? '支出' : '收入'}
                    </Chip>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEdit(category)}
                            isDisabled={isGuest}
                            className="rounded-full"
                        >
                            <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDelete(category)}
                            isDisabled={isGuest}
                            className="rounded-full"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    // 在默认分类卡片中的添加按钮
    const handleAddDefaultCategory = () => {
        console.log('handleAddDefaultCategory被调用');
        setSelectedCategory(null);
        setFormData({
            name: '',
            icon: '',
            type: 'expense',
            is_default: true
        });
        setIsFormOpen(true);
    };

    // 处理删除和编辑默认分类时的权限检查
    const handleEditDefaultCategory = (category: Category) => {
        if (!canEditDefaultCategory) {
            showToast('您没有权限编辑默认分类', 'error');
            return;
        }
        // 原有的编辑处理逻辑
        // ...
    };

    const handleDeleteDefaultCategory = (category: Category) => {
        if (!canEditDefaultCategory) {
            showToast('您没有权限删除默认分类', 'error');
            return;
        }
        // 原有的删除处理逻辑
        // ...
    };

    // 渲染列中的操作按钮需要根据权限决定是否显示
    const renderDefaultCategoryActions = (category: Category) => {
        if (!canEditDefaultCategory) {
            return null; // 无权限不显示编辑和删除按钮
        }

        return (
            <div className="flex gap-2">
                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleEditDefaultCategory(category)}
                >
                    <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => handleDeleteDefaultCategory(category)}
                >
                    <TrashIcon className="w-4 h-4" />
                </Button>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="p-4">
                    <Skeleton />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full p-4">
                <Card>
                    <CardBody className="flex flex-col items-center justify-center gap-4 py-8">
                        <div className="text-danger text-4xl">
                            <ExclamationCircleIcon className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-semibold">加载失败</h3>
                        <p className="text-default-500">
                            {error instanceof Error ? error.message : '获取分类数据失败，请稍后重试'}
                        </p>
                        <Button color="primary" onPress={() => window.location.reload()}>
                            重新加载
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // 如果没有选择家庭，显示家庭选择器和默认分类
    if (!currentFamily) {
        return (
            <div className="w-full space-y-8 max-w-6xl mx-auto">
                {/* 家庭选择器 */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardBody className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="text-warning mb-6">
                            <ExclamationCircleIcon className="h-16 w-16" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">请选择一个家庭</h3>
                        <p className="text-default-500 mb-8 max-w-md">
                            您需要选择一个家庭才能管理自定义分类。自定义分类将与您选择的家庭关联。
                        </p>
                        {families.length > 0 ? (
                            <div className="max-w-xs w-full">
                                <Select
                                    label="选择家庭"
                                    placeholder="请选择一个家庭"
                                    className="w-full mb-4"
                                    size="lg"
                                    onChange={(e) => {
                                        const familyId = parseInt(e.target.value);
                                        const family = families.find(f => f.id === familyId);
                                        if (family) {
                                            setCurrentFamily(family);
                                            showToast('已切换到家庭: ' + family.name, 'success');
                                        }
                                    }}
                                >
                                    {families.map((family) => (
                                        <SelectItem key={family.id} value={family.id}>
                                            {family.name}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <p className="text-sm text-default-400">
                                    选择一个家庭后，您可以管理该家庭的自定义分类
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <p className="text-default-500 mb-4">您还没有创建任何家庭</p>
                                <Button
                                    color="primary"
                                    as={Link}
                                    href="/settings/family"
                                    size="lg"
                                >
                                    创建家庭
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* 默认分类 - 不需要选择家庭 */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardBody className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-primary">默认分类</h2>
                                <p className="text-sm text-default-500 mt-1">
                                    系统预设的分类{isAdmin ? '，管理员可以修改' : ''}
                                </p>
                            </div>
                            {isAdmin && (
                                <Button
                                    color="primary"
                                    startContent={<PlusIcon className="h-5 w-5" />}
                                    onPress={handleAddDefaultCategory}
                                    isDisabled={isGuest}
                                    size="md"
                                    className="min-w-[140px]"
                                >
                                    添加默认分类
                                </Button>
                            )}
                        </div>

                        {defaultCategories.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table
                                    aria-label="默认分类列表"
                                    classNames={{
                                        base: "min-w-full",
                                        table: "min-w-full",
                                        thead: "bg-default-50",
                                        th: "text-default-700 font-semibold",
                                        tr: "hover:bg-default-50 transition-colors border-b border-default-100",
                                    }}
                                >
                                    <TableHeader>
                                        {columns.map(col => (
                                            <TableColumn key={col.key} className="text-sm">{col.label}</TableColumn>
                                        ))}
                                    </TableHeader>
                                    <TableBody items={defaultCategories} emptyContent="暂无默认分类">
                                        {(category) => (
                                            <TableRow key={category.id} className="h-14">
                                                {columns.map(column => (
                                                    <TableCell key={column.key}>
                                                        {renderCell(category, column.key)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50 rounded-lg">
                                <div className="text-default-300 mb-4">
                                    <InboxIcon className="h-16 w-16" />
                                </div>
                                <p className="text-default-600 font-medium mb-2">暂无默认分类</p>
                                {isAdmin && (
                                    <p className="text-default-400 text-sm">点击上方"添加默认分类"按钮创建</p>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* 编辑/添加模态框 */}
                <Modal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    classNames={{
                        base: "max-w-md mx-auto",
                        header: "border-b border-default-100 pb-2",
                        body: "py-6",
                        footer: "border-t border-default-100 pt-2"
                    }}
                    backdrop="blur"
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold">{selectedCategory ? '编辑分类' : '添加分类'}</h3>
                            <p className="text-sm text-default-500">
                                {selectedCategory ? '修改分类信息' : '创建新的分类'}
                            </p>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-6">
                                <Input
                                    label="名称"
                                    placeholder="请输入分类名称"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    variant="bordered"
                                    labelPlacement="outside"
                                    isRequired
                                    startContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-sm">名称</span>
                                        </div>
                                    }
                                />
                                <Input
                                    label="图标"
                                    placeholder="请输入分类图标"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    variant="bordered"
                                    labelPlacement="outside"
                                    isRequired
                                    startContent={
                                        <div className="pointer-events-none flex items-center">
                                            <span className="text-default-400 text-sm">图标</span>
                                        </div>
                                    }
                                />
                                <Select
                                    label="类型"
                                    selectedKeys={formData.type ? [formData.type] : []}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                                    variant="bordered"
                                    labelPlacement="outside"
                                    isRequired
                                >
                                    <SelectItem key="expense" value="expense">支出</SelectItem>
                                    <SelectItem key="income" value="income">收入</SelectItem>
                                </Select>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="bordered"
                                onPress={() => setIsFormOpen(false)}
                                className="min-w-[80px]"
                            >
                                取消
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSubmit}
                                className="min-w-[80px]"
                            >
                                确定
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* 删除确认框 */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    classNames={{
                        base: "max-w-md mx-auto",
                        header: "border-b border-default-100 pb-2",
                        body: "py-6",
                        footer: "border-t border-default-100 pt-2"
                    }}
                    backdrop="blur"
                >
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold">确认删除</h3>
                            <p className="text-sm text-default-500">
                                此操作不可撤销
                            </p>
                        </ModalHeader>
                        <ModalBody>
                            <div className="flex items-center justify-center py-4">
                                <div className="bg-danger-50 p-4 rounded-full mb-4">
                                    <TrashIcon className="h-8 w-8 text-danger" />
                                </div>
                            </div>
                            <p className="text-center">
                                确定要删除 <span className="font-bold">{selectedCategory?.name}</span> 分类吗？
                            </p>
                            <p className="text-center text-default-500 text-sm mt-2">
                                删除后无法恢复，相关的交易记录将失去分类关联。
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="bordered"
                                onPress={() => setIsDeleteModalOpen(false)}
                                className="min-w-[80px]"
                            >
                                取消
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDeleteConfirm}
                                className="min-w-[80px]"
                            >
                                删除
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* 家庭选择器 */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">当前家庭</h2>
                            <p className="text-default-500 mt-1">{currentFamily.name}</p>
                        </div>
                        <Select
                            label="切换家庭"
                            selectedKeys={[currentFamily.id.toString()]}
                            className="max-w-xs w-full"
                            size="sm"
                            onChange={(e) => {
                                const familyId = parseInt(e.target.value);
                                const family = families.find(f => f.id === familyId);
                                if (family) {
                                    setCurrentFamily(family);
                                    showToast('已切换到家庭: ' + family.name, 'success');
                                }
                            }}
                        >
                            {families.map((family) => (
                                <SelectItem key={family.id} value={family.id}>
                                    {family.name}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                </CardBody>
            </Card>

            {/* 自定义分类 */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">自定义分类</h2>
                            <p className="text-sm text-default-500 mt-1">
                                {currentFamily.name} 家庭的自定义分类
                            </p>
                        </div>
                        <Button
                            color="primary"
                            startContent={<PlusIcon className="h-5 w-5" />}
                            onPress={() => {
                                if (!currentFamily) {
                                    showToast('请先选择一个家庭', 'error');
                                    return;
                                }
                                setSelectedCategory(null);
                                setFormData({ name: '', icon: '', type: 'expense' });
                                setIsFormOpen(true);
                            }}
                            isDisabled={isGuest}
                            size="md"
                            className="min-w-[140px]"
                        >
                            添加分类
                        </Button>
                    </div>

                    {customCategories.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table
                                aria-label="自定义分类列表"
                                classNames={{
                                    base: "min-w-full",
                                    table: "min-w-full",
                                    thead: "bg-default-50",
                                    th: "text-default-700 font-semibold",
                                    tr: "hover:bg-default-50 transition-colors border-b border-default-100",
                                }}
                            >
                                <TableHeader>
                                    {customColumns.map(col => (
                                        <TableColumn key={col.key} className="text-sm">{col.label}</TableColumn>
                                    ))}
                                </TableHeader>
                                <TableBody items={customCategories} emptyContent="暂无自定义分类">
                                    {(category) => (
                                        <TableRow key={category.id} className="h-14">
                                            {customColumns.map(column => (
                                                <TableCell key={column.key}>
                                                    {renderCustomCell(category, column.key)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50 rounded-lg">
                            <div className="text-default-300 mb-4">
                                <InboxIcon className="h-16 w-16" />
                            </div>
                            <p className="text-default-600 font-medium mb-2">暂无自定义分类</p>
                            <p className="text-default-400 text-sm">点击上方"添加分类"按钮创建</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* 默认分类 */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-primary">默认分类</h2>
                            <p className="text-sm text-default-500 mt-1">
                                系统预设的分类{isAdmin ? '，管理员可以修改' : ''}
                            </p>
                        </div>
                        {isAdmin && (
                            <Button
                                color="primary"
                                startContent={<PlusIcon className="h-5 w-5" />}
                                onPress={handleAddDefaultCategory}
                                isDisabled={isGuest}
                                size="md"
                                className="min-w-[140px]"
                            >
                                添加默认分类
                            </Button>
                        )}
                    </div>

                    {defaultCategories.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table
                                aria-label="默认分类列表"
                                classNames={{
                                    base: "min-w-full",
                                    table: "min-w-full",
                                    thead: "bg-default-50",
                                    th: "text-default-700 font-semibold",
                                    tr: "hover:bg-default-50 transition-colors border-b border-default-100",
                                }}
                            >
                                <TableHeader>
                                    {columns.map(col => (
                                        <TableColumn key={col.key} className="text-sm">{col.label}</TableColumn>
                                    ))}
                                </TableHeader>
                                <TableBody items={defaultCategories} emptyContent="暂无默认分类">
                                    {(category) => (
                                        <TableRow key={category.id} className="h-14">
                                            {columns.map(column => (
                                                <TableCell key={column.key}>
                                                    {renderCell(category, column.key)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-default-50 rounded-lg">
                            <div className="text-default-300 mb-4">
                                <InboxIcon className="h-16 w-16" />
                            </div>
                            <p className="text-default-600 font-medium mb-2">暂无默认分类</p>
                            {isAdmin && (
                                <p className="text-default-400 text-sm">点击上方"添加默认分类"按钮创建</p>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* 编辑/添加模态框 */}
            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                classNames={{
                    base: "max-w-md mx-auto",
                    header: "border-b border-default-100 pb-2",
                    body: "py-6",
                    footer: "border-t border-default-100 pt-2"
                }}
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold">{selectedCategory ? '编辑分类' : '添加分类'}</h3>
                        <p className="text-sm text-default-500">
                            {selectedCategory ? '修改分类信息' : '创建新的分类'}
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-6">
                            <Input
                                label="名称"
                                placeholder="请输入分类名称"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                variant="bordered"
                                labelPlacement="outside"
                                isRequired
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-sm">名称</span>
                                    </div>
                                }
                            />
                            <Input
                                label="图标"
                                placeholder="请输入分类图标"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                variant="bordered"
                                labelPlacement="outside"
                                isRequired
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-sm">图标</span>
                                    </div>
                                }
                            />
                            <Select
                                label="类型"
                                selectedKeys={formData.type ? [formData.type] : []}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                                variant="bordered"
                                labelPlacement="outside"
                                isRequired
                            >
                                <SelectItem key="expense" value="expense">支出</SelectItem>
                                <SelectItem key="income" value="income">收入</SelectItem>
                            </Select>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="bordered"
                            onPress={() => setIsFormOpen(false)}
                            className="min-w-[80px]"
                        >
                            取消
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleSubmit}
                            className="min-w-[80px]"
                        >
                            确定
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 删除确认框 */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                classNames={{
                    base: "max-w-md mx-auto",
                    header: "border-b border-default-100 pb-2",
                    body: "py-6",
                    footer: "border-t border-default-100 pt-2"
                }}
                backdrop="blur"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-xl font-bold">确认删除</h3>
                        <p className="text-sm text-default-500">
                            此操作不可撤销
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex items-center justify-center py-4">
                            <div className="bg-danger-50 p-4 rounded-full mb-4">
                                <TrashIcon className="h-8 w-8 text-danger" />
                            </div>
                        </div>
                        <p className="text-center">
                            确定要删除 <span className="font-bold">{selectedCategory?.name}</span> 分类吗？
                        </p>
                        <p className="text-center text-default-500 text-sm mt-2">
                            删除后无法恢复，相关的交易记录将失去分类关联。
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="bordered"
                            onPress={() => setIsDeleteModalOpen(false)}
                            className="min-w-[80px]"
                        >
                            取消
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleDeleteConfirm}
                            className="min-w-[80px]"
                        >
                            删除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 