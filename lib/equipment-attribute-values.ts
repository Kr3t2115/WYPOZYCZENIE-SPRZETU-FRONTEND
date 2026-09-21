import { CategoryAttributeDetails } from "@/lib/validations/category-attributes";
import { EquipmentAttributeValue } from "@/lib/validations/equipment";
import { CreateEquipmentAttribute, UpdateEquipmentAttribute } from "@/lib/validations/equipment-attributes";

export type AttributePayloadResult =
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "value"; data: CreateEquipmentAttribute };

// Wartość pola formularza (patrz AttributeValueField) -> ciało zapytania do API.
// TEXT/NUMBER -> value, DATE -> value "yyyy-mm-dd", BOOLEAN -> value "true"/"false", SELECT -> attributeOptionId.
export function toAttributePayload(item: CategoryAttributeDetails, raw: string): AttributePayloadResult {
    const value = raw.trim();

    if (value === "") return { kind: "empty" };

    if (item.attribute.type === "SELECT") {
        return { kind: "value", data: { attributeId: item.attributeId, attributeOptionId: value } };
    }

    if (item.attribute.type === "NUMBER") {
        // dopuszczamy przecinek dziesiętny; do bazy trafia zawsze kropka
        const normalized = value.replace(",", ".");

        if (!Number.isFinite(Number(normalized))) return { kind: "error", message: "Podaj liczbę" };

        return { kind: "value", data: { attributeId: item.attributeId, value: normalized } };
    }

    return { kind: "value", data: { attributeId: item.attributeId, value } };
}

// PATCH nie przyjmuje attributeId - tylko value albo attributeOptionId
export function toUpdateBody(data: CreateEquipmentAttribute): UpdateEquipmentAttribute {
    return data.attributeOptionId !== undefined ? { attributeOptionId: data.attributeOptionId } : { value: data.value };
}

// Zapisana przy sprzęcie wartość -> wartość pola formularza (SELECT: id opcji, reszta: tekst)
export function currentFieldValue(existing: EquipmentAttributeValue | undefined) {
    if (!existing) return "";

    return existing.attributeOptionId ?? existing.value ?? "";
}
