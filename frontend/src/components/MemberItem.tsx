/*
 * @Author: Await
 * @Date: 2025-03-15 11:42:03
 * @LastEditors: Await
 * @LastEditTime: 2025-03-15 12:16:52
 * @Description: 请填写简介
 */
import React from 'react';
import { Avatar, Card, CardBody, Chip } from '@nextui-org/react';
import { User, Crown } from 'lucide-react';
import { Member } from '@/lib/types';

interface MemberItemProps {
    member: Member;
}

const MemberItem: React.FC<MemberItemProps> = ({ member }) => {
    const isAdmin = member.role === 'admin';

    return (
        <Card className="w-full my-2">
            <CardBody className="flex flex-row items-center p-3">
                <Avatar
                    src={member.avatar}
                    showFallback
                    fallback={<User size={20} />}
                    className="mr-3"
                />
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        {isAdmin && (
                            <Chip size="sm" color="warning" startContent={<Crown size={12} />}>
                                管理员
                            </Chip>
                        )}
                    </div>
                    <p className="text-small text-default-500">
                        {member.email}
                    </p>
                </div>
            </CardBody>
        </Card>
    );
};

export default MemberItem; 