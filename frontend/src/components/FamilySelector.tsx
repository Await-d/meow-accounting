'use client';

import React, { useState, useCallback } from 'react';
import {
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Input
} from '@nextui-org/react';
import { useFamily, useCreateFamily } from '@/hooks/useFamily';
import { useToast } from '@/components/Toast';

// 使用内部Family类型而不是导入的类型
interface Family {
    id: number;
    name: string;
    description: string;
    owner_id?: number;
    created_at?: string;
    updated_at?: string;
}

export default function FamilySelector() {
    const { families = [], currentFamily, isLoading, setCurrentFamily } = useFamily();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { showToast } = useToast();
    const [newFamilyName, setNewFamilyName] = useState('');
    const [newFamilyDescription, setNewFamilyDescription] = useState('');
    const [nameError, setNameError] = useState('');
    const createFamilyMutation = useCreateFamily();
    const isCreating = createFamilyMutation.isPending;

    const validateFamilyName = (name: string) => {
        if (!name || name.trim().length === 0) {
            return '家庭名称不能为空';
        }
        if (name.length > 50) {
            return '家庭名称不能超过50个字符';
        }
        return '';
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewFamilyName(value);
        setNameError(validateFamilyName(value));
    };

    const handleCreateFamily = () => {
        const error = validateFamilyName(newFamilyName);
        if (error) {
            setNameError(error);
            return;
        }

        createFamilyMutation.mutate({
            name: newFamilyName,
            description: newFamilyDescription
        }, {
            onSuccess: () => {
                onClose();
                setNewFamilyName('');
                setNewFamilyDescription('');
                setNameError('');
                showToast('创建家庭成功', 'success');
            },
            onError: () => {
                showToast('创建家庭失败', 'error');
            }
        });
    };

    const handleSwitchFamily = useCallback((familyId: string) => {
        const family = families.find(f => f.id.toString() === familyId);
        if (family) {
            setCurrentFamily(family);
            showToast('切换家庭成功', 'success');
        }
    }, [families, setCurrentFamily, showToast]);

    const items = React.useMemo(() => {
        if (!families || families.length === 0) {
            return [{
                key: 'create',
                label: '创建新家庭',
                className: 'text-primary'
            }];
        }

        const menuItems = families.map((family) => ({
            key: family.id.toString(),
            label: family.name,
            className: currentFamily?.id === family.id ? 'text-primary' : ''
        }));

        menuItems.push({
            key: 'create',
            label: '创建新家庭',
            className: 'text-primary'
        });

        return menuItems;
    }, [families, currentFamily]);

    return (
        <div className="flex items-center gap-2">
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        variant="bordered"
                        className="min-w-[120px]"
                        isLoading={isLoading || isCreating}
                    >
                        {currentFamily?.name || '选择家庭'}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="家庭选择"
                    items={items}
                    onAction={(key) => {
                        if (key === 'create') {
                            onOpen();
                        } else {
                            handleSwitchFamily(key.toString());
                        }
                    }}
                    selectionMode="single"
                    selectedKeys={currentFamily ? new Set([currentFamily.id.toString()]) : new Set()}
                >
                    {(item) => (
                        <DropdownItem key={item.key} className={item.className}>
                            {item.label}
                        </DropdownItem>
                    )}
                </DropdownMenu>
            </Dropdown>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>创建新家庭</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Input
                                label="家庭名称"
                                placeholder="请输入家庭名称"
                                value={newFamilyName}
                                onChange={handleNameChange}
                                isInvalid={!!nameError}
                                errorMessage={nameError}
                                isRequired
                            />
                            <Input
                                label="家庭描述"
                                placeholder="请输入家庭描述"
                                value={newFamilyDescription}
                                onChange={(e) => setNewFamilyDescription(e.target.value)}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={onClose}>
                            取消
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleCreateFamily}
                            isDisabled={!newFamilyName || !!nameError}
                            isLoading={isCreating}
                        >
                            创建
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 