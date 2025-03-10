'use client';

import { useAuth } from '@/hooks/useAuth';
import { useUserInvitations } from '@/hooks/useFamily';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { Bars3Icon as HamburgerIcon } from '@heroicons/react/24/outline';
import {
    Navbar as NextUINavbar,
    NavbarContent,
    NavbarBrand,
    NavbarItem,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    DropdownSection,
    Chip,
    Tooltip
} from '@nextui-org/react';
import NextLink from 'next/link';
import clsx from 'clsx';
import { siteConfig } from '@/config/site';
import { linkStyles } from '@/config/styles';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { data: invitations } = useUserInvitations();
    const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || [];
    const hasPendingInvitations = pendingInvitations.length > 0;

    return (
        <NextUINavbar maxWidth="xl" position="sticky">
            <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
                <NavbarBrand as="li" className="gap-3 max-w-fit">
                    <NextLink className="flex justify-start items-center gap-1" href="/">
                        <p className="font-bold text-inherit">家庭记账</p>
                    </NextLink>
                </NavbarBrand>
                <ul className="hidden sm:flex gap-4 justify-start ml-2">
                    {siteConfig.navItems.map((item) => (
                        <NavbarItem key={item.href}>
                            <NextLink
                                className={clsx(
                                    linkStyles({ color: "foreground" }),
                                    "data-[active=true]:text-primary data-[active=true]:font-medium"
                                )}
                                color="foreground"
                                href={item.href}
                            >
                                {item.label}
                            </NextLink>
                        </NavbarItem>
                    ))}
                </ul>
            </NavbarContent>

            <NavbarContent
                className="hidden sm:flex basis-1/5 sm:basis-full"
                justify="end"
            >
                <NavbarItem className="hidden sm:flex gap-2">
                    {user ? (
                        <>
                            {hasPendingInvitations && (
                                <Tooltip content="您有待处理的邀请">
                                    <NextLink href="/settings/invitations">
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            radius="full"
                                            className="relative"
                                        >
                                            <EnvelopeIcon className="h-5 w-5" />
                                            <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {pendingInvitations.length}
                                            </span>
                                        </Button>
                                    </NextLink>
                                </Tooltip>
                            )}
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        variant="light"
                                        radius="full"
                                    >
                                        {user.username}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="用户菜单">
                                    <DropdownItem key="profile" as={NextLink} href="/settings/profile">
                                        个人设置
                                    </DropdownItem>
                                    <DropdownItem key="family" as={NextLink} href="/settings/family">
                                        家庭管理
                                    </DropdownItem>
                                    <DropdownItem key="invitations" as={NextLink} href="/settings/invitations">
                                        邀请管理
                                        {hasPendingInvitations && (
                                            <Chip size="sm" color="danger" variant="flat" className="ml-2">
                                                {pendingInvitations.length}
                                            </Chip>
                                        )}
                                    </DropdownItem>
                                    <DropdownItem key="logout" color="danger" onClick={logout}>
                                        退出登录
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </>
                    ) : (
                        <>
                            <Button as={NextLink} color="primary" href="/login" variant="flat">
                                登录
                            </Button>
                            <Button as={NextLink} color="primary" href="/register" variant="flat">
                                注册
                            </Button>
                        </>
                    )}
                </NavbarItem>
            </NavbarContent>

            <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly variant="light" radius="full">
                            <HamburgerIcon className="h-6 w-6" />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="移动端菜单">
                        <>
                            {siteConfig.navItems.map((item) => (
                                <DropdownItem key={item.href} as={NextLink} href={item.href}>
                                    {item.label}
                                </DropdownItem>
                            ))}
                            <DropdownSection title="用户" showDivider>
                                {user ? (
                                    <>
                                        <DropdownItem key="profile" as={NextLink} href="/settings/profile">
                                            个人设置
                                        </DropdownItem>
                                        <DropdownItem key="family" as={NextLink} href="/settings/family">
                                            家庭管理
                                        </DropdownItem>
                                        <DropdownItem key="invitations" as={NextLink} href="/settings/invitations">
                                            邀请管理
                                            {hasPendingInvitations && (
                                                <Chip size="sm" color="danger" variant="flat" className="ml-2">
                                                    {pendingInvitations.length}
                                                </Chip>
                                            )}
                                        </DropdownItem>
                                        <DropdownItem key="logout" color="danger" onClick={logout}>
                                            退出登录
                                        </DropdownItem>
                                    </>
                                ) : (
                                    <>
                                        <DropdownItem key="login" as={NextLink} href="/login">
                                            登录
                                        </DropdownItem>
                                        <DropdownItem key="register" as={NextLink} href="/register">
                                            注册
                                        </DropdownItem>
                                    </>
                                )}
                            </DropdownSection>
                        </>
                    </DropdownMenu>
                </Dropdown>
            </NavbarContent>
        </NextUINavbar>
    );
} 