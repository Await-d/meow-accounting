import { Request, Response } from 'express';
import * as familyModel from '../models/family';
import { validateFamily } from '../utils/validation';

// 创建家庭
export async function createFamily(req: Request, res: Response) {
    try {
        const { name, description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 验证输入
        const validationError = validateFamily(name, description);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const familyId = await familyModel.createFamily(name, description, userId);
        res.status(201).json({ id: familyId });
    } catch (error) {
        console.error('创建家庭失败:', error);
        res.status(500).json({ error: '创建家庭失败' });
    }
}

// 获取家庭信息
export async function getFamilyById(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是家庭成员
        const isMember = await familyModel.isFamilyMember(familyId, userId);
        if (!isMember) {
            return res.status(403).json({ error: '无权访问此家庭' });
        }

        const family = await familyModel.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({ error: '家庭不存在' });
        }

        res.json(family);
    } catch (error) {
        console.error('获取家庭信息失败:', error);
        res.status(500).json({ error: '获取家庭信息失败' });
    }
}

// 获取用户的所有家庭
export async function getUserFamilies(req: Request, res: Response) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const families = await familyModel.getUserFamilies(userId);

        // 获取每个家庭的成员数量
        const familiesWithMemberCount = await Promise.all(
            families.map(async (family) => {
                const members = await familyModel.getFamilyMembers(family.id);
                return {
                    ...family,
                    member_count: members.length
                };
            })
        );

        res.json(familiesWithMemberCount);
    } catch (error) {
        console.error('获取用户家庭列表失败:', error);
        res.status(500).json({ error: '获取用户家庭列表失败' });
    }
}

// 获取家庭成员
export async function getFamilyMembers(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是家庭成员
        const isMember = await familyModel.isFamilyMember(familyId, userId);
        if (!isMember) {
            return res.status(403).json({ error: '无权访问此家庭' });
        }

        const members = await familyModel.getFamilyMembers(familyId);
        res.json(members);
    } catch (error) {
        console.error('获取家庭成员列表失败:', error);
        res.status(500).json({ error: '获取家庭成员列表失败' });
    }
}

// 添加家庭成员
export async function addFamilyMember(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const { email, role, expiresInHours, maxUses, isGeneric } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, currentUserId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权添加成员' });
        }

        // 创建邀请而不是直接添加成员
        const invitation = await familyModel.createFamilyInvitation(
            familyId,
            isGeneric ? null : email, // 如果是通用邀请，则不指定邮箱
            role,
            currentUserId,
            expiresInHours || 48, // 默认48小时
            maxUses || 1 // 默认1次
        );

        // 构建邀请链接
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`;

        res.status(201).json({
            message: '邀请已创建',
            inviteLink,
            token: invitation.token,
            isGeneric: isGeneric || false,
            expiresInHours: expiresInHours || 48,
            maxUses: maxUses || 1
        });
    } catch (error) {
        console.error('创建邀请失败:', error);
        res.status(500).json({ error: '创建邀请失败' });
    }
}

// 获取邀请信息
export async function getInvitation(req: Request, res: Response) {
    try {
        const { token } = req.params;

        // 清理过期邀请
        await familyModel.cleanupExpiredInvitations();

        const invitation = await familyModel.getInvitationByToken(token);

        if (!invitation) {
            return res.status(404).json({ error: '邀请不存在或已过期' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: `邀请已${invitation.status === 'accepted' ? '接受' : invitation.status === 'rejected' ? '拒绝' : '过期'}` });
        }

        // 检查是否过期
        if (new Date(invitation.expires_at) < new Date()) {
            await familyModel.rejectInvitation(token);
            return res.status(400).json({ error: '邀请已过期' });
        }

        res.json(invitation);
    } catch (error) {
        console.error('获取邀请信息失败:', error);
        res.status(500).json({ error: '获取邀请信息失败' });
    }
}

// 接受邀请
export async function acceptInvitation(req: Request, res: Response) {
    try {
        const { token } = req.params;
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 获取邀请信息
        const invitation = await familyModel.getInvitationByToken(token);

        if (!invitation) {
            return res.status(404).json({ error: '邀请不存在或已过期' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: `邀请已${invitation.status === 'accepted' ? '接受' : invitation.status === 'rejected' ? '拒绝' : '过期'}` });
        }

        // 检查是否过期
        if (new Date(invitation.expires_at) < new Date()) {
            await familyModel.rejectInvitation(token);
            return res.status(400).json({ error: '邀请已过期' });
        }

        // 检查邮箱是否匹配（如果邀请指定了邮箱）
        if (invitation.email && userEmail !== invitation.email) {
            return res.status(403).json({ error: '您无权接受此邀请，请使用被邀请的邮箱账号登录' });
        }

        // 接受邀请
        await familyModel.acceptInvitation(token, userId);

        res.json({ message: '已成功加入家庭' });
    } catch (error) {
        console.error('接受邀请失败:', error);
        res.status(500).json({ error: '接受邀请失败' });
    }
}

// 拒绝邀请
export async function rejectInvitation(req: Request, res: Response) {
    try {
        const { token } = req.params;
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 获取邀请信息
        const invitation = await familyModel.getInvitationByToken(token);

        if (!invitation) {
            return res.status(404).json({ error: '邀请不存在或已过期' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: `邀请已${invitation.status === 'accepted' ? '接受' : invitation.status === 'rejected' ? '拒绝' : '过期'}` });
        }

        // 检查邮箱是否匹配（如果邀请指定了邮箱）
        if (invitation.email && userEmail !== invitation.email) {
            return res.status(403).json({ error: '您无权拒绝此邀请，请使用被邀请的邮箱账号登录' });
        }

        // 拒绝邀请
        await familyModel.rejectInvitation(token);

        res.json({ message: '已拒绝邀请' });
    } catch (error) {
        console.error('拒绝邀请失败:', error);
        res.status(500).json({ error: '拒绝邀请失败' });
    }
}

// 获取用户的待处理邀请
export async function getUserInvitations(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        if (!userId || !userEmail) {
            return res.status(401).json({ error: '未登录' });
        }

        // 清理过期邀请
        await familyModel.cleanupExpiredInvitations();

        // 获取用户的待处理邀请
        const invitations = await familyModel.getPendingInvitationsByEmail(userEmail);

        // 处理敏感数据，确保安全
        const safeInvitations = invitations.map(invitation => {
            // 移除敏感字段
            const { token, ...safeData } = invitation;

            // 只返回必要的token信息
            return {
                ...safeData,
                // 只在前端需要使用token的地方返回
                token: token
            };
        });

        res.json(safeInvitations);
    } catch (error) {
        console.error('获取用户邀请失败:', error);
        res.status(500).json({ error: '获取用户邀请失败' });
    }
}

// 更新成员角色
export async function updateMemberRole(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const { userId, role } = req.body;
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, currentUserId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权更新成员角色' });
        }

        await familyModel.updateMemberRole(familyId, userId, role);
        res.json({ message: '角色更新成功' });
    } catch (error) {
        console.error('更新成员角色失败:', error);
        res.status(500).json({ error: '更新成员角色失败' });
    }
}

// 移除家庭成员
export async function removeFamilyMember(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);
        const currentUserId = req.user?.id;

        console.log(`尝试移除家庭成员: familyId=${familyId}, userId=${userId}, 当前用户=${currentUserId}`);

        if (!currentUserId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查要移除的用户是否存在
        const isMember = await familyModel.isFamilyMember(familyId, userId);
        if (!isMember) {
            console.log(`用户不是家庭成员: familyId=${familyId}, userId=${userId}`);
            return res.status(404).json({ error: '该用户不是家庭成员' });
        }

        // 如果是自己退出家庭，或者是管理员移除成员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, currentUserId);
        if (currentUserId !== userId && !isAdmin) {
            return res.status(403).json({ error: '无权移除成员' });
        }

        // 检查是否是家庭创建者
        const family = await familyModel.getFamilyById(familyId);
        if (userId === family?.owner_id) {
            return res.status(403).json({ error: '不能移除家庭创建者' });
        }

        await familyModel.removeFamilyMember(familyId, userId, currentUserId);
        console.log(`成功移除家庭成员: familyId=${familyId}, userId=${userId}`);

        // 如果是自己退出家庭，需要更新当前家庭ID
        if (currentUserId === userId) {
            res.json({ message: '您已成功退出家庭' });
        } else {
            res.json({ message: '成员移除成功' });
        }
    } catch (error) {
        console.error('移除家庭成员失败:', error);
        res.status(500).json({ error: '移除家庭成员失败' });
    }
}

// 获取家庭的所有邀请
export async function getFamilyInvitations(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是家庭管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, userId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权查看邀请' });
        }

        // 获取家庭的所有邀请
        const invitations = await familyModel.getFamilyInvitations(familyId);

        // 处理敏感数据，确保安全
        const safeInvitations = invitations.map(invitation => {
            // 对邮箱进行部分隐藏处理
            if (invitation.email) {
                const emailParts = invitation.email.split('@');
                if (emailParts.length === 2) {
                    const username = emailParts[0];
                    const domain = emailParts[1];

                    // 如果用户名长度大于3，则隐藏中间部分
                    let maskedUsername = username;
                    if (username.length > 3) {
                        maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 3) + username.substring(username.length - 1);
                    }

                    invitation.email = `${maskedUsername}@${domain}`;
                }
            }

            return invitation;
        });

        res.json(safeInvitations);
    } catch (error) {
        console.error('获取家庭邀请失败:', error);
        res.status(500).json({ error: '获取家庭邀请失败' });
    }
}

// 删除邀请
export async function deleteInvitation(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const invitationId = parseInt(req.params.invitationId);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查是否是家庭管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, userId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权删除邀请' });
        }

        // 删除邀请
        await familyModel.deleteInvitation(invitationId, familyId);

        res.json({ message: '邀请已删除' });
    } catch (error) {
        console.error('删除邀请失败:', error);
        if (error instanceof Error && error.message === '邀请不存在或已被处理') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: '删除邀请失败' });
    }
}

// 更新家庭信息
export async function updateFamily(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const { name, description } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 验证输入
        const validationError = validateFamily(name, description);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // 检查是否是管理员
        const isAdmin = await familyModel.isFamilyAdmin(familyId, userId);
        if (!isAdmin) {
            return res.status(403).json({ error: '无权更新家庭信息' });
        }

        // 检查家庭是否存在
        const family = await familyModel.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({ error: '家庭不存在' });
        }

        // 更新家庭信息
        await familyModel.updateFamily(familyId, name, description);

        res.json({ message: '家庭信息更新成功' });
    } catch (error) {
        console.error('更新家庭信息失败:', error);
        res.status(500).json({ error: '更新家庭信息失败' });
    }
}

// 删除家庭
export async function deleteFamily(req: Request, res: Response) {
    try {
        const familyId = parseInt(req.params.id);
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查家庭是否存在
        const family = await familyModel.getFamilyById(familyId);
        if (!family) {
            return res.status(404).json({ error: '家庭不存在' });
        }

        // 检查是否是家庭创建者
        if (family.owner_id !== userId) {
            return res.status(403).json({ error: '只有家庭创建者才能解散家庭' });
        }

        // 删除家庭
        await familyModel.deleteFamily(familyId);

        res.json({ message: '家庭删除成功' });
    } catch (error) {
        console.error('删除家庭失败:', error);
        res.status(500).json({ error: '删除家庭失败' });
    }
} 