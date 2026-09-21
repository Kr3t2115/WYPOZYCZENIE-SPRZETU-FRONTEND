"use client"

import {SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/dashboard/app-sidebar";


export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                {children}
            </main>
        </SidebarProvider>
        </div>
    )
}

