"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Divider,
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Spinner,
    Tabs,
    Tab,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@nextui-org/react";
import { useRoute } from "@/hooks/useRoute";
import { useFamily } from "@/hooks/useFamily";
import { useAuth } from "@/hooks/useAuth";
import { Route, RoutePermission, CreateRouteData, UpdateRouteData } from "@/lib/types";
import { PlusIcon } from "@/components/Icons";
import RouteList from "@/components/RouteList";

export default function RoutesPage() {
    const { user } = useAuth();
    const {
        userRoutes,
        familyRoutes,
        isLoadingUserRoutes,
        isLoadingFamilyRoutes,
        fetchUserRoutes,
        fetchFamilyRoutes,
        createRoute,
        updateRoute,
        deleteRoute,
        getPermissionOptions
    } = useRoute();
    const { families, isLoading: isLoadingFamilies } = useFamily();

    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [formData, setFormData] = useState<CreateRouteData | UpdateRouteData>({
        path: "",
        name: "",
        description: "",
        permission: RoutePermission.PRIVATE,
        family_id: null
    });

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

    // 加载路由数据
    useEffect(() => {
        fetchUserRoutes();
        if (user?.currentFamilyId) {
            fetchFamilyRoutes(user.currentFamilyId);
        }
    }, [fetchUserRoutes, fetchFamilyRoutes, user?.currentFamilyId]);

    const permissionOptions = getPermissionOptions();
    const isCreator = useMemo(() => {
        return (route: Route) => {
            if (!user) return false;
            return route.user_id === user.id;
        };
    }, [user]);

    // 处理表单输入变化
    const handleInputChange = (key: string, value: any) => {
        setFormData({
            ...formData,
            [key]: value
        });
    };

    // 打开创建路由模态框
    const handleOpenCreateModal = () => {
        setSelectedRoute(null);
        setFormData({
            path: "",
            name: "",
            description: "",
            permission: RoutePermission.PRIVATE,
            family_id: null
        });
        onOpen();
    };

    // 打开编辑路由模态框
    const handleOpenEditModal = (route: Route) => {
        setSelectedRoute(route);
        setFormData({
            name: route.name,
            description: route.description,
            permission: route.permission,
            is_active: route.is_active
        });
        onOpen();
    };

    // 打开查看路由模态框
    const handleOpenViewModal = (route: Route) => {
        setSelectedRoute(route);
        onViewOpen();
    };

    // 打开删除路由确认模态框
    const handleOpenDeleteModal = (route: Route) => {
        setSelectedRoute(route);
        onDeleteOpen();
    };

    // 提交表单
    const handleSubmit = () => {
        if (selectedRoute) {
            // 更新路由
            updateRoute({
                id: selectedRoute.id,
                data: formData as UpdateRouteData
            });
        } else {
            // 创建路由
            createRoute(formData as CreateRouteData);
        }
        onClose();
    };

    // 删除路由
    const handleDelete = () => {
        if (selectedRoute) {
            deleteRoute(selectedRoute.id);
            onDeleteClose();
        }
    };

    // 获取权限标签颜色
    const getPermissionColor = (permission: RoutePermission) => {
        switch (permission) {
            case RoutePermission.PUBLIC:
                return "success";
            case RoutePermission.PRIVATE:
                return "danger";
            case RoutePermission.FAMILY:
                return "warning";
            case RoutePermission.ADMIN:
                return "primary";
            default:
                return "default";
        }
    };

    // 获取权限标签文本
    const getPermissionLabel = (permission: RoutePermission) => {
        const option = permissionOptions.find(opt => opt.key === permission);
        return option ? option.label : permission;
    };

    // 获取状态标签颜色
    const getStatusColor = (isActive: boolean) => {
        return isActive ? "success" : "danger";
    };

    if (isLoadingUserRoutes || isLoadingFamilyRoutes || isLoadingFamilies) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex justify-between">
                    <h2 className="text-xl font-bold">路由管理</h2>
                    <Button
                        color="primary"
                        startContent={<PlusIcon />}
                        onPress={handleOpenCreateModal}
                    >
                        创建路由
                    </Button>
                </CardHeader>
                <Divider />
                <CardBody>
                    <Tabs aria-label="路由类型">
                        <Tab key="personal" title="个人路由">
                            <RouteList
                                routes={userRoutes}
                                isCreator={isCreator}
                                onView={handleOpenViewModal}
                                onEdit={handleOpenEditModal}
                                onDelete={handleOpenDeleteModal}
                                getPermissionLabel={getPermissionLabel}
                                getPermissionColor={getPermissionColor}
                                getStatusColor={getStatusColor}
                            />
                        </Tab>
                        {user?.currentFamilyId && (
                            <Tab key="family" title="家庭路由">
                                <RouteList
                                    routes={familyRoutes}
                                    isCreator={isCreator}
                                    onView={handleOpenViewModal}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleOpenDeleteModal}
                                    getPermissionLabel={getPermissionLabel}
                                    getPermissionColor={getPermissionColor}
                                    getStatusColor={getStatusColor}
                                />
                            </Tab>
                        )}
                    </Tabs>
                </CardBody>
            </Card>

            {/* 创建/编辑路由模态框 */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>{selectedRoute ? "编辑路由" : "创建路由"}</ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    {!selectedRoute && (
                                        <Input
                                            label="路径"
                                            placeholder="输入路由路径，例如: /dashboard"
                                            value={formData.path as string}
                                            onChange={(e) => handleInputChange("path", e.target.value)}
                                            isRequired
                                        />
                                    )}
                                    <Input
                                        label="名称"
                                        placeholder="输入路由名称"
                                        value={formData.name as string}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        isRequired
                                    />
                                    <Textarea
                                        label="描述"
                                        placeholder="输入路由描述"
                                        value={formData.description as string}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                    />
                                    <Select
                                        label="权限"
                                        placeholder="选择路由权限"
                                        selectedKeys={[formData.permission as string]}
                                        onChange={(e) => handleInputChange("permission", e.target.value)}
                                        isRequired
                                    >
                                        {permissionOptions.map((option) => (
                                            <SelectItem key={option.key} value={option.key}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                    {!selectedRoute && formData.permission !== RoutePermission.PRIVATE && (
                                        <Select
                                            label="家庭"
                                            placeholder="选择关联的家庭"
                                            selectedKeys={formData.family_id ? [formData.family_id.toString()] : []}
                                            onChange={(e) => handleInputChange("family_id", e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            {(families || []).map((family) => (
                                                <SelectItem key={family.id.toString()} value={family.id.toString()}>
                                                    {family.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    )}
                                    {selectedRoute && (
                                        <Select
                                            label="状态"
                                            placeholder="选择路由状态"
                                            selectedKeys={[(formData.is_active === undefined ? selectedRoute.is_active : formData.is_active) ? "true" : "false"]}
                                            onChange={(e) => handleInputChange("is_active", e.target.value === "true")}
                                        >
                                            <SelectItem key="true" value="true">启用</SelectItem>
                                            <SelectItem key="false" value="false">禁用</SelectItem>
                                        </Select>
                                    )}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    取消
                                </Button>
                                <Button color="primary" onPress={handleSubmit}>
                                    {selectedRoute ? "更新" : "创建"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* 查看路由详情模态框 */}
            <Modal isOpen={isViewOpen} onClose={onViewClose} size="md">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>路由详情</ModalHeader>
                            <ModalBody>
                                {selectedRoute && (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">路径</p>
                                            <p>{selectedRoute.path}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">名称</p>
                                            <p>{selectedRoute.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">描述</p>
                                            <p>{selectedRoute.description || "无"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">权限</p>
                                            <p>{getPermissionLabel(selectedRoute.permission)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">状态</p>
                                            <p>{selectedRoute.is_active ? "启用" : "禁用"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">创建时间</p>
                                            <p>{selectedRoute.created_at}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">更新时间</p>
                                            <p>{selectedRoute.updated_at}</p>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    关闭
                                </Button>
                                {isCreator(selectedRoute!) && (
                                    <Button color="primary" onPress={() => {
                                        onViewClose();
                                        handleOpenEditModal(selectedRoute!);
                                    }}>
                                        编辑
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* 删除路由确认模态框 */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>确认删除</ModalHeader>
                            <ModalBody>
                                <p>确定要删除路由 "{selectedRoute?.name}" 吗？此操作不可撤销。</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    取消
                                </Button>
                                <Button color="danger" onPress={handleDelete}>
                                    删除
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
} 