import { Badge } from "@/components/ui/badge";
import { ExtensionStatus } from "@/lib/validations/rentals-extensions";

export const EXTENSION_STATUS_CONFIG: Record<
    ExtensionStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    PENDING: { label: "Oczekuje", variant: "secondary" },
    APPROVED: { label: "Zaakceptowane", variant: "default" },
    REJECTED: { label: "Odrzucone", variant: "destructive" },
};

export function ExtensionStatusBadge({ status }: { status: ExtensionStatus }) {
    const config = EXTENSION_STATUS_CONFIG[status];

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
