import React from 'react';
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
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/components/Toast';

export default function FamilySelector() {
    const { families, currentFamily, loading, createFamily, switchFamily } = useFamily();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { showToast } = useToast();
    const [newFamilyName, setNewFamilyName] = React.useState('');
    const [newFamilyDescription, setNewFamilyDescription] = React.useState('');
    const [nameError, setNameError] = React.useState('');

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

    const handleCreateFamily = async () => {
        const error = validateFamilyName(newFamilyName);
        if (error) {
            setNameError(error);
            return;
        }

        try {
            await createFamily({
                name: newFamilyName,
                description: newFamilyDescription
            });
            onClose();
            setNewFamilyName('');
            setNewFamilyDescription('');
            setNameError('');
        } catch (error) {
            showToast('创建家庭失败', 'error');
        }
    };

    const items = React.useMemo(() => {
        const menuItems = families.map((family) => ({
            key: family.id.toString(),
            label: family.name,
            className: ''
        }));
        menuItems.push({
            key: 'create',
            label: '创建新家庭',
            className: 'text-primary'
        });
        return menuItems;
    }, [families]);

    return (
        <div className="flex items-center gap-2">
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        variant="bordered"
                        className="min-w-[120px]"
                        isLoading={loading}
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
                            switchFamily(Number(key));
                        }
                    }}
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
                        >
                            创建
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 