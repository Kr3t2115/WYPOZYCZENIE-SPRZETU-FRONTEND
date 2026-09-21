import { Badge } from "@/components/ui/badge";
import { AttributeType } from "@/lib/validations/attributes";

export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
    TEXT: "Tekst",
    NUMBER: "Liczba",
    SELECT: "Lista wyboru",
    DATE: "Data",
    BOOLEAN: "Tak / Nie",
};

export function AttributeTypeBadge({ type }: { type: AttributeType }) {
    return <Badge variant={type === "SELECT" ? "default" : "secondary"}>{ATTRIBUTE_TYPE_LABELS[type]}</Badge>;
}
