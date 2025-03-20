import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Checkbox,
    ScrollShadow
} from '@nextui-org/react';
import { Role, Permission } from '@/hooks/useRoles';

interface RoleEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; permissions: string[] }) => void;
    role?: Role;
    permissions?: Permission[];
    isLoading?: boolean;
}

export default function RoleEditModal({
    isOpen,
    onClose,
    onSubmit,
    role,
    permissions = [],
    isLoading
}: RoleEditModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[]
    });

    // 当角色数据变化时更新表单
    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name,
                description: role.description,
                permissions: role.permissions.map(p => p.code)
            });
        } else {
            setFormData({
                name: '',
                description: '',
                permissions: []
            });
        }
    }, [role]);

    const handleSubmit = () => {
        if (!formData.name) return;
        onSubmit(formData);
    };

    // 按类别分组权限
    const groupedPermissions = permissions.reduce((groups, permission) => {
        const category = permission.code.split(':')[0];
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(permission);
        return groups;
    }, {} as Record<string, Permission[]>);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-w-2xl mx-auto",
                header: "border-b border-default-100 pb-2",
                body: "py-6",
                footer: "border-t border-default-100 pt-2"
            }}
            backdrop="blur"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold">{role ? '编辑角色' : '创建角色'}</h3>
                    <p className="text-sm text-default-500">
                        {role ? '修改角色信息和权限' : '创建新的角色并设置权限'}
                    </p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-6">
                        <Input
                            label="角色名称"
                            placeholder="请输入角色名称"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            variant="bordered"
                            isRequired
                            isDisabled={role?.isSystem}
                        />
                        <Input
                            label="角色描述"
                            placeholder="请输入角色描述"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            variant="bordered"
                            isDisabled={role?.isSystem}
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2">权限设置</label>
                            <ScrollShadow className="h-[300px]">
                                <div className="space-y-6">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category} className="space-y-2">
                                            <h4 className="font-medium capitalize">{category}</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map((permission) => (
                                                    <Checkbox
                                                        key={permission.code}
                                                        isSelected={formData.permissions.includes(permission.code)}
                                                        onValueChange={(checked) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                permissions: checked
                                                                    ? [...prev.permissions, permission.code]
                                                                    : prev.permissions.filter(p => p !== permission.code)
                                                            }));
                                                        }}
                                                        isDisabled={role?.isSystem}
                                                    >
                                                        <div>
                                                            <p className="text-sm">{permission.name}</p>
                                                            <p className="text-xs text-default-500">
                                                                {permission.description}
                                                            </p>
                                                        </div>
                                                    </Checkbox>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollShadow>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="bordered"
                        onPress={onClose}
                        className="min-w-[80px]"
                    >
                        取消
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        className="min-w-[80px]"
                        isLoading={isLoading}
                        isDisabled={!formData.name || role?.isSystem}
                    >
                        确定
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
} 