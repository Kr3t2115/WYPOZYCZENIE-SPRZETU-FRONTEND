import { Badge } from "@/components/ui/badge";
import { ReservationStatus } from "@/lib/validations/reservations";

export const RESERVATION_STATUS_CONFIG: Record<
    ReservationStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    PENDING: { label: "Oczekuje", variant: "secondary" },
    APPROVED: { label: "Zaakceptowana", variant: "default" },
    REJECTED: { label: "Odrzucona", variant: "destructive" },
    CANCELLED: { label: "Anulowana", variant: "outline" },
    COMPLETED: { label: "Zrealizowana", variant: "outline" },
};

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
    const config = RESERVATION_STATUS_CONFIG[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
