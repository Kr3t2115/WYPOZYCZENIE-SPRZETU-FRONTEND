"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/auth";
import { useAuth } from "@/store/auth-store";

export function useLogout() {
    const router = useRouter();
    const setUser = useAuth((state) => state.setUser);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            await logout();
        } catch {
        } finally {
            setUser(null);
            router.push("/login");
            setIsLoggingOut(false);
        }
    }

    return { logout: handleLogout, isLoggingOut };
}
