/*
 * @Author: Await
 * @Date: 2025-03-12 19:31:46
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:51:56
 * @Description: 路由管理表格列定义
 */
import { Button, Tooltip } from '@nextui-org/react';
import { Edit2, Trash2, Eye, Power } from 'lucide-react';
import { Route, RoutePermission } from '@/lib/types';

interface RowData extends Route {
    onEdit?: (route: Route) => void;
    onDelete?: (route: Route) => void;
    onToggleActive?: (route: Route) => void;
    onViewStats?: (route: Route) => void;
}

export const columns = [
    {
        header: '路径',
        accessorKey: 'path',
    },
    {
        header: '名称',
        accessorKey: 'name',
    },
    {
        header: '描述',
        accessorKey: 'description',
    },
    {
        header: '权限',
        accessorKey: 'permission',
        cell: ({ row }: { row: { original: RowData } }) => {
            const permission = row.original.permission;
            const permissionMap: Record<RoutePermission, string> = {
                [RoutePermission.PUBLIC]: '公开',
                [RoutePermission.PRIVATE]: '私有',
                [RoutePermission.FAMILY]: '家庭',
                [RoutePermission.ADMIN]: '管理员'
            };
            return permissionMap[permission] || permission;
        }
    },
    {
        header: '状态',
        accessorKey: 'is_active',
        cell: ({ row }: { row: { original: RowData } }) => row.original.is_active ? '启用' : '禁用'
    },
    {
        header: '创建时间',
        accessorKey: 'created_at',
        cell: ({ row }: { row: { original: RowData } }) => new Date(row.original.created_at).toLocaleString()
    },
    {
        header: '更新时间',
        accessorKey: 'updated_at',
        cell: ({ row }: { row: { original: RowData } }) => new Date(row.original.updated_at).toLocaleString()
    },
    {
        header: '操作',
        cell: ({ row }: { row: { original: RowData } }) => {
            const route = row.original;
            return (
                <div className="flex gap-2">
                    <Tooltip content="编辑">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => route.onEdit?.(route)}
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                    <Tooltip content="删除">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => route.onDelete?.(route)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                    <Tooltip content={route.is_active ? "禁用" : "启用"}>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color={route.is_active ? "warning" : "success"}
                            onPress={() => route.onToggleActive?.(route)}
                        >
                            <Power className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                    <Tooltip content="查看性能">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => route.onViewStats?.(route)}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                </div>
            );
        }
    }
]; 