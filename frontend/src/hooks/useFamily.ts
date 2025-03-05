'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { useAuth } from './useAuth';
import {
    Family,
    FamilyMember,
    CreateFamilyData,
    AddFamilyMemberData,
    createFamily as apiCreateFamily,
    getUserFamilies as apiGetUserFamilies,
    getFamilyById as apiGetFamilyById,
    getFamilyMembers as apiGetFamilyMembers,
    addFamilyMember as apiAddFamilyMember,
    updateMemberRole as apiUpdateMemberRole,
    removeFamilyMember as apiRemoveFamilyMember
} from '@/lib/api';

export function useFamily() {
    const [families, setFamilies] = useState<Family[]>([]);
    const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    // 获取用户的所有家庭
    const fetchFamilies = async () => {
        try {
            setLoading(true);
            const data = await apiGetUserFamilies();
            setFamilies(data);

            // 如果没有选择当前家庭，默认选择第一个
            if (!currentFamily && data.length > 0) {
                setCurrentFamily(data[0]);
            }
        } catch (error) {
            showToast('获取家庭列表失败', 'error');
            console.error('获取家庭列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 获取家庭成员
    const fetchMembers = async (familyId: number) => {
        try {
            setLoading(true);
            const data = await apiGetFamilyMembers(familyId);
            setMembers(data);
        } catch (error) {
            showToast('获取家庭成员失败', 'error');
            console.error('获取家庭成员失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 创建家庭
    const createFamily = async (data: CreateFamilyData) => {
        try {
            setLoading(true);
            const result = await apiCreateFamily(data);
            showToast('创建家庭成功', 'success');

            // 重新获取家庭列表
            await fetchFamilies();

            return result;
        } catch (error) {
            showToast('创建家庭失败', 'error');
            console.error('创建家庭失败:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 添加家庭成员
    const addMember = async (familyId: number, data: AddFamilyMemberData) => {
        try {
            setLoading(true);
            await apiAddFamilyMember(familyId, data);
            showToast('添加成员成功', 'success');

            // 重新获取成员列表
            await fetchMembers(familyId);
        } catch (error) {
            showToast('添加成员失败', 'error');
            console.error('添加成员失败:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 更新成员角色
    const updateRole = async (familyId: number, userId: number, role: 'admin' | 'member') => {
        try {
            setLoading(true);
            await apiUpdateMemberRole(familyId, userId, role);
            showToast('更新角色成功', 'success');

            // 重新获取成员列表
            await fetchMembers(familyId);
        } catch (error) {
            showToast('更新角色失败', 'error');
            console.error('更新角色失败:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 移除成员
    const removeMember = async (familyId: number, userId: number) => {
        try {
            setLoading(true);
            await apiRemoveFamilyMember(familyId, userId);
            showToast('移除成员成功', 'success');

            // 重新获取成员列表
            await fetchMembers(familyId);
        } catch (error) {
            showToast('移除成员失败', 'error');
            console.error('移除成员失败:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 切换当前家庭
    const switchFamily = async (familyId: number) => {
        try {
            setLoading(true);
            const family = await apiGetFamilyById(familyId);
            setCurrentFamily(family);

            // 获取新家庭的成员列表
            await fetchMembers(familyId);
        } catch (error) {
            showToast('切换家庭失败', 'error');
            console.error('切换家庭失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 检查用户是否是管理员
    const isAdmin = (userId: number = user?.id || 0) => {
        return members.some(member =>
            member.user_id === userId &&
            (member.role === 'owner' || member.role === 'admin')
        );
    };

    // 初始化：获取家庭列表
    useEffect(() => {
        if (user) {
            fetchFamilies();
        }
    }, [user]);

    // 当切换家庭时，获取成员列表
    useEffect(() => {
        if (currentFamily) {
            fetchMembers(currentFamily.id);
        }
    }, [currentFamily?.id]);

    return {
        families,
        currentFamily,
        members,
        loading,
        createFamily,
        addMember,
        updateRole,
        removeMember,
        switchFamily,
        isAdmin,
        fetchFamilies,
        fetchMembers
    };
} 