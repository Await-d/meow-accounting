import React from 'react';
import { Chip, Card, CardBody } from '@nextui-org/react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency } from '@/utils/format';

interface TransactionItemProps {
    transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
    const isIncome = transaction.type === 'income';

    return (
        <div className="py-2">
            <Card className="w-full">
                <CardBody className="flex flex-row justify-between items-center p-3">
                    <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                        {transaction.category && (
                            <Chip size="sm" color="primary" className="mt-1">
                                {transaction.category}
                            </Chip>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <p className={`font-bold ${isIncome ? "text-success" : "text-danger"}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <Chip
                            startContent={isIncome ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            color={isIncome ? "success" : "danger"}
                            size="sm"
                        >
                            {isIncome ? '收入' : '支出'}
                        </Chip>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default TransactionItem; 