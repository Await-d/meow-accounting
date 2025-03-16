import React from 'react';
import { Button, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { Settings, LayoutDashboard, Users, Database, Shield, FileText, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface AdminActionButtonProps {
    className?: string;
    variant?: 'flat' | 'solid' | 'bordered' | 'light' | 'faded' | 'shadow' | 'ghost';
}

const AdminActionButton: React.FC<AdminActionButtonProps> = ({
    className,
    variant = 'solid'
}) => {
    const router = useRouter();

    const handleAction = (action: string) => {
        switch (action) {
            case 'system':
                router.push('/settings/system');
                break;
            case 'users':
                router.push('/settings/users');
                break;
            case 'families':
                router.push('/settings/families');
                break;
            case 'categories':
                router.push('/settings/categories');
                break;
            case 'logs':
                router.push('/settings/logs');
                break;
            case 'backup':
                router.push('/settings/backup');
                break;
            default:
                router.push('/settings');
        }
    };

    return (
        <Dropdown>
            <DropdownTrigger>
                <Button
                    className={`${variant !== 'shadow' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : className}`}
                    endContent={<ChevronDown size={16} />}
                    startContent={
                        <motion.div
                            animate={{ rotate: [0, 15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Settings size={18} />
                        </motion.div>
                    }
                    radius="full"
                    size="md"
                    variant={variant}
                    color="secondary"
                >
                    后台管理
                </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="后台管理操作" variant="flat">
                <DropdownItem
                    key="dashboard"
                    startContent={<LayoutDashboard size={16} />}
                    description="管理系统仪表盘"
                    onPress={() => handleAction('system')}
                >
                    系统设置
                </DropdownItem>
                <DropdownItem
                    key="users"
                    startContent={<Users size={16} />}
                    description="管理用户账户"
                    onPress={() => handleAction('users')}
                >
                    用户管理
                </DropdownItem>
                <DropdownItem
                    key="families"
                    startContent={<Users size={16} />}
                    description="管理家庭信息和成员"
                    onPress={() => handleAction('families')}
                >
                    家庭管理
                </DropdownItem>
                <DropdownItem
                    key="categories"
                    startContent={<Database size={16} />}
                    description="管理收支分类"
                    onPress={() => handleAction('categories')}
                >
                    分类管理
                </DropdownItem>
                <DropdownItem
                    key="logs"
                    startContent={<FileText size={16} />}
                    description="查看系统日志"
                    onPress={() => handleAction('logs')}
                >
                    系统日志
                </DropdownItem>
                <DropdownItem
                    key="backup"
                    startContent={<Shield size={16} />}
                    description="备份与恢复数据"
                    onPress={() => handleAction('backup')}
                >
                    备份恢复
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
};

export default AdminActionButton; 