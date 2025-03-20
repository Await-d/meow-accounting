import React, { useMemo } from 'react';
import { Card, CardBody, CardHeader, Divider, Skeleton, Button, Spinner } from '@nextui-org/react';
import { DollarSign, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { useAccounts } from '@/hooks/useAccounts';

interface AccountsSummaryProps {
  transactions: Transaction[];
  isLoading?: boolean;
  isPersonalMode?: boolean;
}

const AccountsSummary: React.FC<AccountsSummaryProps> = ({
  transactions = [],
  isLoading = false,
  isPersonalMode = false
}) => {
  const { accounts, isLoading: apiLoading, error } = useAccounts();

  // 计算总收入和支出
  const incomeTotal = useMemo(() => {
    if (!transactions?.length) return 0;
    return transactions.filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }, [transactions]);

  const expenseTotal = useMemo(() => {
    if (!transactions?.length) return 0;
    return transactions.filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return incomeTotal - expenseTotal;
  }, [incomeTotal, expenseTotal]);

  // 格式化货币显示
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // 刷新页面函数
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card className="overflow-hidden h-full border border-default-100">
      <CardHeader className="flex gap-3 items-center">
        <div className="p-2 rounded-full bg-primary/10">
          <Wallet size={20} className="text-primary" />
        </div>
        <div className="flex flex-col">
          <p className="text-md font-semibold">{isPersonalMode ? "我的账户" : "家庭账户"}</p>
          <p className="text-small text-default-500">总览</p>
        </div>
      </CardHeader>
      <CardBody className="py-2">
        {isLoading || apiLoading ? (
          <Spinner size="sm" />
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="text-danger mb-2" size={24} />
            <p className="text-danger">加载账户信息失败</p>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<RefreshCw size={16} />}
              className="mt-2"
              onPress={handleRefresh}
            >
              重试
            </Button>
          </div>
        ) : accounts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <DollarSign className="text-primary/50 h-10 w-10 mb-2" />
            <p className="font-medium mb-2">尚未添加账户</p>
            <p className="text-sm text-default-500">请在设置中添加您的账户</p>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalBalance)}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-default-500">收入</p>
                <p className="text-xl font-semibold text-success">
                  {formatCurrency(incomeTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-default-500">支出</p>
                <p className="text-xl font-semibold text-danger">
                  {formatCurrency(expenseTotal)}
                </p>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default AccountsSummary; 