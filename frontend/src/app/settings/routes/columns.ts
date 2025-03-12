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
        cell: ({ row }) => {
            const permission = row.original.permission;
            const permissionMap = {
                'PUBLIC': '公开',
                'PRIVATE': '私有',
                'FAMILY': '家庭',
                'ADMIN': '管理员'
            };
            return permissionMap[permission] || permission;
        }
    },
    {
        header: '状态',
        accessorKey: 'is_active',
        cell: ({ row }) => row.original.is_active ? '启用' : '禁用'
    },
    {
        header: '创建时间',
        accessorKey: 'created_at',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString()
    },
    {
        header: '更新时间',
        accessorKey: 'updated_at',
        cell: ({ row }) => new Date(row.original.updated_at).toLocaleString()
    }
]; 