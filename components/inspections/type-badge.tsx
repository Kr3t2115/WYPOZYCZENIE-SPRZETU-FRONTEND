import { Badge } from "@/components/ui/badge";
import { InspectionType } from "@/lib/validations/rentals-inspections";

export const INSPECTION_TYPE_CONFIG: Record<InspectionType, { label: string; variant: "default" | "secondary" }> = {
    CHECKOUT: { label: "Wydanie", variant: "default" },
    RETURN: { label: "Zwrot", variant: "secondary" },
};

export function InspectionTypeBadge({ type }: { type: InspectionType }) {
    const config = INSPECTION_TYPE_CONFIG[type];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
