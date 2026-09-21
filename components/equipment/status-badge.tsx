import { Badge } from "@/components/ui/badge";
import { EquipmentStatus } from "@/lib/validations/equipment";

export const EQUIPMENT_STATUS_CONFIG: Record<
    EquipmentStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    AVAILABLE: { label: "Dostępny", variant: "default" },
    RENTED: { label: "Wypożyczony", variant: "secondary" },
    MAINTENANCE: { label: "Serwis", variant: "destructive" },
    RETIRED: { label: "Wycofany", variant: "outline" },
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
    const config = EQUIPMENT_STATUS_CONFIG[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
