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
            // backend czyści ciasteczka access_token / refresh_token (są httpOnly, front ich nie ruszy)
            await logout();
        } catch {
            // np. sesja już wygasła (401) albo brak sieci - lokalnie i tak kończymy sesję
        } finally {
            setUser(null);
            router.replace("/login");
            setIsLoggingOut(false);
        }
    }

    return { logout: handleLogout, isLoggingOut };
}
