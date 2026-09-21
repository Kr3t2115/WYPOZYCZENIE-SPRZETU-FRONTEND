import { Badge } from "@/components/ui/badge";
import { ROLE_TYPE } from "@/store/auth-store";

export const ROLE_LABELS: Record<ROLE_TYPE, string> = {
    STUDENT: "Student",
    SECRETARIAT: "Sekretariat",
    IT_STAFF: "IT",
};

const ROLE_VARIANTS: Record<ROLE_TYPE, "default" | "secondary" | "outline"> = {
    IT_STAFF: "default",
    SECRETARIAT: "secondary",
    STUDENT: "outline",
};

export function RoleBadge({ role }: { role: ROLE_TYPE }) {
    return <Badge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
    return <Badge variant={isActive ? "outline" : "destructive"}>{isActive ? "Aktywne" : "Nieaktywne"}</Badge>;
}
