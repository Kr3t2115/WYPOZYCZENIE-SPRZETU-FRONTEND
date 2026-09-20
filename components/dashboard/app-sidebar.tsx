"use client";

import {BadgeCheck, Bell, ChevronsUpDown, Cpu, CreditCard, LogOut, Sparkles} from 'lucide-react';
import {
    Sidebar,
    SidebarFooter,
    SidebarContent,
    SidebarHeader,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenu,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import {getMenuItemsByRole} from "@/config/navigation";
import {useAuth} from "@/store/auth-store";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {useIsMobile} from "@/hooks/use-mobile";


export function AppSidebar() {
    const user = useAuth((state) => state.user);
    const menuGroups = getMenuItemsByRole(user?.role);

    const isMobile = useIsMobile()

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                        <Cpu/>
                        <span>wypożyczSANie</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarHeader>
            <SidebarContent className="p-2">
                {menuGroups.map((group, groupIndex) => (
                    <SidebarGroup key={group.title ?? `group-${groupIndex}`}>
                        {group.title && (
                            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <Link href={item.href}>
                                                <SidebarMenuButton>
                                                    <Icon/>
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            </Link>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>


                <h1>{user?.role}</h1>

                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="w-full" render={                    <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            />}>

                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={"https://github.com/shadcn.png"} alt={user?.email} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user?.firstName + " " + user?.lastName}</span>
                                    <span className="truncate text-xs">{user?.email}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuGroup>

                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                                <AvatarImage src={"https://github.com/shadcn.png"} alt={user?.email} />
                                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-medium">{user?.firstName + " " + user?.lastName}</span>
                                                <span className="truncate text-xs">{user?.email}</span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                </DropdownMenuGroup>
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Sparkles />
                                        Upgrade to Pro
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <BadgeCheck />
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <CreditCard />
                                        Billing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Bell />
                                        Notifications
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <LogOut />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}