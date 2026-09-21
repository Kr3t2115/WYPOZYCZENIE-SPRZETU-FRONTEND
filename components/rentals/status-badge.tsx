import { Badge } from "@/components/ui/badge";
import { RentalStatus } from "@/lib/validations/rentals";

export const RENTAL_STATUS_CONFIG: Record<
    RentalStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    ACTIVE: { label: "Aktywne", variant: "default" },
    OVERDUE: { label: "Po terminie", variant: "destructive" },
    RETURNED: { label: "Zwrócone", variant: "secondary" },
    LOST: { label: "Zgubione", variant: "outline" },
};

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
    const config = RENTAL_STATUS_CONFIG[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
