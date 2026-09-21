"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isLogged } from "@/lib/api/auth";
import { useAuth } from "@/store/auth-store";

// "/" -> /dashboard dla zalogowanego, /login dla niezalogowanego.
// Ciasteczka sesji są httpOnly i należą do domeny API, więc o zalogowaniu rozstrzyga request do backendu
// (z automatycznym odświeżeniem tokena w apiClient), a nie odczyt ciasteczka po stronie serwera.
export function RootRedirect() {
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        async function redirect() {
            let target = "/login";

            try {
                await isLogged();

                // dane użytkownika (rola, imię) pochodzą z odpowiedzi logowania i siedzą w store;
                // bez nich menu i dashboard nie mają z czego zbudować widoku, więc trzeba się zalogować ponownie
                if (useAuth.getState().user) target = "/dashboard";
            } catch {
                // 401 (brak/wygasła sesja) i błędy sieci -> logowanie
            }

            if (!cancelled) router.replace(target);
        }

        redirect();

        return () => {
            cancelled = true;
        };
    }, [router]);

    return (
        <div className="flex h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Ładowanie...
        </div>
    );
}
