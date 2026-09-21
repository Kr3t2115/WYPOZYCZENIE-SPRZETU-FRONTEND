"use client"

import { useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailField } from "@/components/detail-field";
import { AttributeValueField } from "@/components/equipment/attribute-value-field";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAttributesOptions } from "@/lib/api/attributes-options";
import { getCategoryAttributes } from "@/lib/api/category-attributes";
import { insert, update } from "@/lib/api/equipment-attributes";
import { currentFieldValue, toAttributePayload, toUpdateBody } from "@/lib/equipment-attribute-values";
import { AttributeOption } from "@/lib/validations/attributes-options";
import { CategoryAttributeDetails } from "@/lib/validations/category-attributes";
import { EquipmentAttributeValue } from "@/lib/validations/equipment";
import { CreateEquipmentAttribute } from "@/lib/validations/equipment-attributes";

type Change = {
    item: CategoryAttributeDetails;
    // istniejący wiersz wartości (PATCH) albo brak (POST)
    existing: EquipmentAttributeValue | undefined;
    data: CreateEquipmentAttribute;
};

type AttributesEditorProps = {
    equipmentId: string;
    categoryId: string;
    // aktualne wartości zapisane przy sprzęcie
    values: EquipmentAttributeValue[];
    // opis wartości spoza atrybutów kategorii (pokazywane tylko do odczytu)
    describeValue: (value: EquipmentAttributeValue) => { label: string; text: string };
    // po zapisie (także częściowym) - rodzic odświeża sprzęt
    onChanged: () => void;
    onClose: () => void;
};

// Edycja wartości atrybutów sprzętu. Pola pochodzą z atrybutów kategorii sprzętu.
// Backend ma osobne endpointy: POST dodaje wartość atrybutu, którego sprzęt jeszcze nie ma, PATCH zmienia
// istniejącą. Zapisanej wartości nie da się usunąć (PATCH odrzuca pustą), więc można ją tylko zmienić.
export function EquipmentAttributesEditor({
    equipmentId,
    categoryId,
    values,
    describeValue,
    onChanged,
    onClose,
}: AttributesEditorProps) {
    const categoryAttributes = useAsyncData("category-attributes:" + categoryId, () =>
        getCategoryAttributes(`categoryId=${categoryId}&limit=1000`)
    );
    const items = categoryAttributes.data?.data ?? [];

    // opcje list pobieramy tylko wtedy, gdy kategoria ma atrybut typu SELECT
    const needsOptions = items.some((item) => item.attribute.type === "SELECT");
    const options = useAsyncData(needsOptions ? "attributes-options:all" : null, () =>
        getAttributesOptions("limit=1000")
    );

    const optionsByAttribute = new Map<string, AttributeOption[]>();
    for (const option of [...(options.data?.data ?? [])].sort((a, b) => a.order - b.order)) {
        optionsByAttribute.set(option.attributeId, [...(optionsByAttribute.get(option.attributeId) ?? []), option]);
    }

    const existingByAttribute = new Map(values.map((value) => [value.attributeId, value]));
    const inCategory = new Set(items.map((item) => item.attributeId));
    // wartości atrybutów, których kategoria już nie ma - tylko do odczytu
    const extras = categoryAttributes.data ? values.filter((value) => !inCategory.has(value.attributeId)) : [];

    // pole nieruszone nie ma wpisu w `drafts` i pokazuje wartość zapisaną w rekordzie
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const fieldValue = (item: CategoryAttributeDetails) =>
        drafts[item.attributeId] ?? currentFieldValue(existingByAttribute.get(item.attributeId));

    const isChanged = (item: CategoryAttributeDetails) =>
        item.attributeId in drafts &&
        drafts[item.attributeId].trim() !== currentFieldValue(existingByAttribute.get(item.attributeId)).trim();

    const hasChanges = items.some(isChanged);
    const loading = (!categoryAttributes.data && categoryAttributes.loading) || (needsOptions && !options.data && options.loading);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();

        const nextErrors: Record<string, string> = {};
        const changes: Change[] = [];

        for (const item of items) {
            const existing = existingByAttribute.get(item.attributeId);
            const current = currentFieldValue(existing);

            if (!isChanged(item)) {
                // pole nietknięte: sprawdzamy tylko, czy atrybut wymagany w ogóle ma wartość
                if (item.required && current === "") nextErrors[item.attributeId] = "To pole jest wymagane";
                continue;
            }

            const payload = toAttributePayload(item, fieldValue(item));

            if (payload.kind === "empty") {
                // zmienione na puste = próba usunięcia zapisanej wartości
                nextErrors[item.attributeId] = "Zapisanej wartości nie da się usunąć - wpisz nową.";
            } else if (payload.kind === "error") {
                nextErrors[item.attributeId] = payload.message;
            } else {
                changes.push({ item, existing, data: payload.data });
            }
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0 || changes.length === 0) return;

        setIsSaving(true);

        // każdy atrybut to osobny wiersz, więc zapisy są niezależne i mogą iść równolegle
        const results = await Promise.allSettled(
            changes.map(({ existing, data }) =>
                existing ? update(equipmentId, existing.id, toUpdateBody(data)) : insert(equipmentId, data)
            )
        );

        const failed: Record<string, string> = {};
        const saved: string[] = [];

        results.forEach((result, index) => {
            const attributeId = changes[index].item.attributeId;

            if (result.status === "fulfilled") saved.push(attributeId);
            else failed[attributeId] = getErrorMessage(result.reason, "Nie udało się zapisać wartości.");
        });

        // zapisane pola przestają być "brudne", a te, które się nie udały, zostają w formularzu z komunikatem
        setDrafts((prev) => {
            const next = { ...prev };
            saved.forEach((attributeId) => delete next[attributeId]);
            return next;
        });
        setErrors(failed);
        setIsSaving(false);

        onChanged();
        if (Object.keys(failed).length === 0) onClose();
    }

    if (categoryAttributes.error != null) {
        return (
            <QueryError
                title="Nie udało się pobrać atrybutów kategorii"
                error={categoryAttributes.error}
                onRetry={categoryAttributes.retry}
            />
        );
    }

    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
            {options.error != null && (
                <Alert variant="destructive">
                    <AlertDescription>Nie udało się pobrać opcji list - pola wyboru mogą być puste.</AlertDescription>
                </Alert>
            )}

            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Kategoria tego sprzętu nie ma przypisanych atrybutów.{" "}
                    <Link href={`/admin/categories/${categoryId}`} className="underline">
                        Dodaj je w ustawieniach kategorii
                    </Link>
                    .
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {items.map((item) => (
                        <AttributeValueField
                            key={item.id}
                            item={item}
                            value={fieldValue(item)}
                            options={optionsByAttribute.get(item.attributeId) ?? []}
                            error={errors[item.attributeId]}
                            disabled={isSaving}
                            // wartości już zapisanej backend nie pozwala wyczyścić
                            clearable={currentFieldValue(existingByAttribute.get(item.attributeId)) === ""}
                            onChange={(next) => setDrafts((prev) => ({ ...prev, [item.attributeId]: next }))}
                        />
                    ))}
                </div>
            )}

            {extras.length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                        Wartości atrybutów, których kategoria już nie używa (tylko do odczytu)
                    </span>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        {extras.map((value) => {
                            const described = describeValue(value);

                            return (
                                <DetailField key={value.id} label={described.label}>
                                    {described.text}
                                </DetailField>
                            );
                        })}
                    </dl>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Zapisaną wartość można zmienić, ale nie usunąć.
            </p>

            <div className="flex gap-2">
                <Button type="submit" disabled={!hasChanges || isSaving}>
                    {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
                <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
                    Anuluj
                </Button>
            </div>
        </form>
    );
}
