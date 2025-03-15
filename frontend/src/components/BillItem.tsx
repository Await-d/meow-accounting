/*
 * @Author: Await
 * @Date: 2025-03-15 11:41:47
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 12:26:45
 * @Description: 请填写简介
 */
import React from 'react';
import { Chip, Card, CardBody } from '@nextui-org/react';
import { Clock, CheckCircle } from 'lucide-react';
import { Bill } from '@/lib/types';
import { formatCurrency } from '@/utils/format';

interface BillItemProps {
    bill: Bill;
}

const BillItem: React.FC<BillItemProps> = ({ bill }) => {
    const dueDate = new Date(bill.dueDate);
    const now = new Date();
    const isOverdue = !bill.isPaid && dueDate < now;

    return (
        <Card className="w-full my-2">
            <CardBody className="flex flex-row justify-between items-center p-3">
                <div>
                    <div className="font-medium">{bill.title}</div>
                    <div className="text-xs text-gray-500">
                        到期日: {new Date(bill.dueDate).toLocaleDateString()}
                    </div>
                    {bill.description && (
                        <p className="text-sm text-default-500">
                            {bill.description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <p className={`font-bold ${bill.isPaid ? "text-default-500" : (isOverdue ? "text-danger" : "text-warning")}`}>
                        {formatCurrency(bill.amount)}
                    </p>
                    {bill.isPaid ? (
                        <Chip color="success" startContent={<CheckCircle size={12} />}>已付</Chip>
                    ) : isOverdue ? (
                        <Chip color="danger" startContent={<Clock size={12} />}>已逾期</Chip>
                    ) : (
                        <Chip color="warning" startContent={<Clock size={12} />}>待付</Chip>
                    )}
                </div>
            </CardBody>
        </Card>
    );
};

export default BillItem; 