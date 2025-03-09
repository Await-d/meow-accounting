/*
 * @Author: Await
 * @Date: 2025-03-09 20:19:54
 * @LastEditors: Await
 * @LastEditTime: 2025-03-09 21:05:15
 * @Description: 请填写简介
 */
import React, { useState, useMemo } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Input,
    Select,
    SelectItem,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@nextui-org/react";
import { Route, RoutePermission } from '@/lib/types';
import { EditIcon, DeleteIcon, EyeIcon, ChevronDownIcon } from "@/components/Icons";
import { formatDate } from "@/lib/utils";

interface RouteListProps {
    routes: Route[];
    isCreator: (route: Route) => boolean;
    onView: (route: Route) => void;
    onEdit: (route: Route) => void;
    onDelete: (route: Route) => void;
    getPermissionLabel: (permission: RoutePermission) => string;
    getPermissionColor: (permission: RoutePermission) => string;
    getStatusColor: (isActive: boolean) => string;
}

type SortField = 'name' | 'path' | 'permission' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function RouteList({
    routes,
    isCreator,
    onView,
    onEdit,
    onDelete,
    getPermissionLabel,
    getPermissionColor,
    getStatusColor
}: RouteListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [permissionFilter, setPermissionFilter] = useState<RoutePermission | 'all'>('all');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // 过滤和排序路由
    const filteredAndSortedRoutes = useMemo(() => {
        let result = [...routes];

        // 搜索过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(route =>
                route.name.toLowerCase().includes(query) ||
                route.path.toLowerCase().includes(query) ||
                route.description.toLowerCase().includes(query)
            );
        }

        // 权限过滤
        if (permissionFilter !== 'all') {
            result = result.filter(route => route.permission === permissionFilter);
        }

        // 排序
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'path':
                    comparison = a.path.localeCompare(b.path);
                    break;
                case 'permission':
                    comparison = a.permission.localeCompare(b.permission);
                    break;
                case 'created_at':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [routes, searchQuery, permissionFilter, sortField, sortDirection]);

    // 处理排序
    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Input
                    placeholder="搜索路由..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                />
                <Select
                    placeholder="权限筛选"
                    selectedKeys={[permissionFilter]}
                    onChange={(e) => setPermissionFilter(e.target.value as RoutePermission | 'all')}
                    className="max-w-xs"
                >
                    <SelectItem key="all" value="all">全部</SelectItem>
                    <SelectItem key={RoutePermission.PUBLIC} value={RoutePermission.PUBLIC}>公开</SelectItem>
                    <SelectItem key={RoutePermission.PRIVATE} value={RoutePermission.PRIVATE}>私有</SelectItem>
                    <SelectItem key={RoutePermission.FAMILY} value={RoutePermission.FAMILY}>家庭</SelectItem>
                    <SelectItem key={RoutePermission.ADMIN} value={RoutePermission.ADMIN}>管理员</SelectItem>
                </Select>
            </div>

            <Table aria-label="路由列表">
                <TableHeader>
                    <TableColumn>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button variant="light" endContent={<ChevronDownIcon />}>
                                    名称
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu onAction={(key) => handleSort(key as SortField)}>
                                <DropdownItem key="name">按名称排序</DropdownItem>
                                <DropdownItem key="path">按路径排序</DropdownItem>
                                <DropdownItem key="permission">按权限排序</DropdownItem>
                                <DropdownItem key="created_at">按创建时间排序</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </TableColumn>
                    <TableColumn>路径</TableColumn>
                    <TableColumn>权限</TableColumn>
                    <TableColumn>状态</TableColumn>
                    <TableColumn>创建时间</TableColumn>
                    <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody emptyContent="暂无路由数据">
                    {filteredAndSortedRoutes.map((route) => (
                        <TableRow key={route.id}>
                            <TableCell>{route.name}</TableCell>
                            <TableCell>{route.path}</TableCell>
                            <TableCell>
                                <Chip color={getPermissionColor(route.permission) as any} size="sm">
                                    {getPermissionLabel(route.permission)}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Chip color={getStatusColor(route.is_active) as any} size="sm">
                                    {route.is_active ? "启用" : "禁用"}
                                </Chip>
                            </TableCell>
                            <TableCell>{formatDate(route.created_at)}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        onPress={() => onView(route)}
                                    >
                                        <EyeIcon />
                                    </Button>
                                    {isCreator(route) && (
                                        <>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => onEdit(route)}
                                            >
                                                <EditIcon />
                                            </Button>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                color="danger"
                                                onPress={() => onDelete(route)}
                                            >
                                                <DeleteIcon />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 