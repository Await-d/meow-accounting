/*
 * @Author: Await
 * @Date: 2025-03-12 19:32:29
 * @LastEditors: Await
 * @LastEditTime: 2025-03-13 19:55:57
 * @Description: 请填写简介
 */
import React from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Pagination
} from '@nextui-org/react';

interface DataTableProps {
    columns: any[];
    data: any[];
    isLoading?: boolean;
    pagination?: boolean;
    pageSize?: number;
}

export function DataTable({
    columns,
    data,
    isLoading = false,
    pagination = false,
    pageSize = 10
}: DataTableProps) {
    const [page, setPage] = React.useState(1);
    const rowsPerPage = pageSize;

    const pages = Math.ceil(data.length / rowsPerPage);
    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return data.slice(start, end);
    }, [page, data, rowsPerPage]);

    const renderCell = React.useCallback((item: any, columnKey: string) => {
        const column = columns.find(col => col.accessorKey === columnKey);

        if (column?.cell) {
            return column.cell({ row: { original: item } });
        }

        return item[columnKey];
    }, [columns]);

    return (
        <div className="w-full">
            <Table
                aria-label="数据表格"
                bottomContent={
                    pagination && pages > 1 ? (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={setPage}
                            />
                        </div>
                    ) : null
                }
            >
                <TableHeader>
                    {columns.map((column, index) => (
                        <TableColumn key={column.accessorKey || `column-${index}`}>
                            {column.header}
                        </TableColumn>
                    ))}
                </TableHeader>
                <TableBody
                    items={items}
                    loadingContent={<Spinner />}
                    isLoading={isLoading}
                    emptyContent={isLoading ? null : "暂无数据"}
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {columns.map((column) => (
                                <TableCell key={column.accessorKey}>
                                    {renderCell(item, column.accessorKey)}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
} 