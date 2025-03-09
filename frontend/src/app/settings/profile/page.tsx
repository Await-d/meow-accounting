'use client';

import { useState } from 'react';
import {
    Card,
    CardBody,
    Input,
    Button,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from '@nextui-org/react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { useUpdateProfile, useChangePassword } from '@/lib/api';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const { mutate: updateProfile } = useUpdateProfile();
    const { mutate: changePassword } = useChangePassword();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileUpdate = async () => {
        if (!formData.username || !formData.email) {
            showToast('请填写完整信息', 'error');
            return;
        }

        try {
            setIsLoading(true);
            await updateProfile(formData);
            updateUser({
                ...user!,
                ...formData,
            });
            showToast('更新成功', 'success');
        } catch (error) {
            showToast('更新失败', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (
            !passwordData.oldPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword
        ) {
            showToast('请填写完整信息', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            return;
        }

        try {
            setIsLoading(true);
            await changePassword({
                old_password: passwordData.oldPassword,
                new_password: passwordData.newPassword,
            });
            showToast('密码修改成功', 'success');
            onClose();
            setPasswordData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            showToast('密码修改失败', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardBody className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">个人资料</h2>
                        <p className="text-default-500 text-sm">
                            您可以在这里修改您的个人信息
                        </p>
                    </div>

                    <Divider />

                    <div className="space-y-4">
                        <Input
                            label="用户名"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                        />
                        <Input
                            label="邮箱"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                        />
                        <Button
                            color="primary"
                            onPress={handleProfileUpdate}
                            isLoading={isLoading}
                        >
                            保存修改
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">安全设置</h2>
                        <p className="text-default-500 text-sm">
                            修改您的登录密码
                        </p>
                    </div>

                    <Divider />

                    <div>
                        <Button
                            color="primary"
                            variant="flat"
                            onPress={onOpen}
                            isDisabled={isLoading}
                        >
                            修改密码
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>修改密码</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <Input
                                type="password"
                                label="当前密码"
                                value={passwordData.oldPassword}
                                onChange={(e) =>
                                    setPasswordData({
                                        ...passwordData,
                                        oldPassword: e.target.value,
                                    })
                                }
                            />
                            <Input
                                type="password"
                                label="新密码"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                    setPasswordData({
                                        ...passwordData,
                                        newPassword: e.target.value,
                                    })
                                }
                            />
                            <Input
                                type="password"
                                label="确认新密码"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                    setPasswordData({
                                        ...passwordData,
                                        confirmPassword: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={onClose}>
                            取消
                        </Button>
                        <Button
                            color="primary"
                            onPress={handlePasswordChange}
                            isLoading={isLoading}
                        >
                            确认修改
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 