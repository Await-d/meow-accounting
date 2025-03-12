/*
 * @Author: Await
 * @Date: 2025-03-12 21:45:00
 * @LastEditors: Await
 * @LastEditTime: 2025-03-12 21:55:15
 * @Description: 路由表单组件
 */
'use client';

import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Switch
} from '@nextui-org/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Route, RoutePermission, RouteType } from '@/lib/types';

// 表单验证schema
const routeSchema = z.object({
    path: z.string().min(1, '路径不能为空'),
    name: z.string().min(1, '名称不能为空'),
    description: z.string(),
    type: z.nativeEnum(RouteType),
    permission: z.nativeEnum(RoutePermission),
    is_active: z.boolean(),
    user_id: z.number().optional(),
    family_id: z.number().nullable().optional()
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: RouteFormData) => Promise<void>;
    initialData?: Route;
}

export function RouteForm({ isOpen, onClose, onSubmit, initialData }: RouteFormProps) {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema),
        defaultValues: initialData || {
            path: '',
            name: '',
            description: '',
            type: RouteType.DASHBOARD,
            permission: RoutePermission.PRIVATE,
            is_active: true
        }
    });

    // 重置表单
    React.useEffect(() => {
        if (isOpen) {
            reset(initialData);
        }
    }, [isOpen, initialData, reset]);

    // 提交处理
    const handleFormSubmit = async (data: RouteFormData) => {
        try {
            await onSubmit(data);
            onClose();
        } catch (error) {
            console.error('Failed to submit route:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <ModalHeader>
                        {initialData ? '编辑路由' : '新增路由'}
                    </ModalHeader>
                    <ModalBody className="space-y-4">
                        <Controller
                            name="path"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="路径"
                                    placeholder="请输入路由路径"
                                    errorMessage={errors.path?.message}
                                    isInvalid={!!errors.path}
                                />
                            )}
                        />
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    label="名称"
                                    placeholder="请输入路由名称"
                                    errorMessage={errors.name?.message}
                                    isInvalid={!!errors.name}
                                />
                            )}
                        />
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    label="描述"
                                    placeholder="请输入路由描述"
                                    errorMessage={errors.description?.message}
                                    isInvalid={!!errors.description}
                                />
                            )}
                        />
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    label="类型"
                                    errorMessage={errors.type?.message}
                                    isInvalid={!!errors.type}
                                >
                                    <SelectItem key={RouteType.DASHBOARD} value={RouteType.DASHBOARD}>仪表盘</SelectItem>
                                    <SelectItem key={RouteType.TRANSACTIONS} value={RouteType.TRANSACTIONS}>交易记录</SelectItem>
                                    <SelectItem key={RouteType.STATISTICS} value={RouteType.STATISTICS}>统计分析</SelectItem>
                                    <SelectItem key={RouteType.SETTINGS} value={RouteType.SETTINGS}>设置</SelectItem>
                                    <SelectItem key={RouteType.CUSTOM} value={RouteType.CUSTOM}>自定义页面</SelectItem>
                                </Select>
                            )}
                        />
                        <Controller
                            name="permission"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    label="权限"
                                    errorMessage={errors.permission?.message}
                                    isInvalid={!!errors.permission}
                                >
                                    <SelectItem key={RoutePermission.PUBLIC} value={RoutePermission.PUBLIC}>公开，任何人可访问</SelectItem>
                                    <SelectItem key={RoutePermission.PRIVATE} value={RoutePermission.PRIVATE}>私有，仅创建者可访问</SelectItem>
                                    <SelectItem key={RoutePermission.FAMILY} value={RoutePermission.FAMILY}>家庭，仅家庭成员可访问</SelectItem>
                                    <SelectItem key={RoutePermission.ADMIN} value={RoutePermission.ADMIN}>管理员，仅家庭管理员可访问</SelectItem>
                                </Select>
                            )}
                        />
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    name={field.name}
                                    ref={field.ref}
                                    isSelected={field.value}
                                    onValueChange={field.onChange}
                                >
                                    启用状态
                                </Switch>
                            )}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                            取消
                        </Button>
                        <Button color="primary" type="submit" isLoading={isSubmitting}>
                            确定
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 