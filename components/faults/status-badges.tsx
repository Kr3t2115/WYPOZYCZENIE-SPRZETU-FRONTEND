import { Badge } from "@/components/ui/badge";
import { FaultSeverity, FaultStatus, OccurrenceType } from "@/lib/validations/faults";

type Variant = "default" | "secondary" | "destructive" | "outline";

export const FAULT_SEVERITY_CONFIG: Record<FaultSeverity, { label: string; variant: Variant }> = {
    MINOR: { label: "Drobna", variant: "secondary" },
    MODERATE: { label: "Umiarkowana", variant: "default" },
    CRITICAL: { label: "Krytyczna", variant: "destructive" },
};

export const FAULT_STATUS_CONFIG: Record<FaultStatus, { label: string; variant: Variant }> = {
    OPEN: { label: "Otwarta", variant: "default" },
    IN_REVIEW: { label: "W rozpatrywaniu", variant: "secondary" },
    RESOLVED: { label: "Rozwiązana", variant: "outline" },
    DISMISSED: { label: "Odrzucona", variant: "outline" },
};

export const OCCURRENCE_LABELS: Record<OccurrenceType, string> = {
    DURING_USE: "W trakcie użytkowania",
    ON_PICKUP: "Przy odbiorze",
};

export function FaultSeverityBadge({ severity }: { severity: FaultSeverity }) {
    const config = FAULT_SEVERITY_CONFIG[severity];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function FaultStatusBadge({ status }: { status: FaultStatus }) {
    const config = FAULT_STATUS_CONFIG[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
