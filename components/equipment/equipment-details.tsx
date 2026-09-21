"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentAttributesEditor } from "@/components/equipment/attributes-editor";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { DetailField } from "@/components/detail-field";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { ApiError } from "@/lib/api-client";
import { getById } from "@/lib/api/equipment";
import { getAttributes } from "@/lib/api/attributes";
import { getAttributesOptions } from "@/lib/api/attributes-options";
import { formatDate } from "@/lib/date";
import { Attribute } from "@/lib/validations/attributes";
import { EquipmentAttributeValue } from "@/lib/validations/equipment";

function formatAttributeValue(
    item: EquipmentAttributeValue,
    attribute: Attribute | undefined,
    optionLabels: Map<string, string>
) {
    if (item.attributeOptionId) return optionLabels.get(item.attributeOptionId) ?? "—";
    if (item.value === null || item.value === "") return "—";

    switch (attribute?.type) {
        case "BOOLEAN":
            return item.value === "true" ? "Tak" : item.value === "false" ? "Nie" : item.value;
        case "DATE": {
            const date = new Date(item.value);
            return Number.isNaN(date.getTime()) ? item.value : formatDate(item.value);
        }
        case "NUMBER":
            return attribute.unit ? `${item.value} ${attribute.unit}` : item.value;
        default:
            return item.value;
    }
}

// "user" - /equipment/[id] (student), "desk" - /desk/inventory/[id] (IT_STAFF / SECRETARIAT)
export function EquipmentDetails({ id, mode }: { id: string; mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const listHref = desk ? "/desk/inventory" : "/equipment";

    const equipment = useAsyncData("equipment:" + id, () => getById(id));

    // po zapisie wartości sprzęt odświeża się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = equipment.data ?? (equipment.stale?.id === id ? equipment.stale : undefined);

    const [editing, setEditing] = useState(false);
    const attributes = useAsyncData("attributes", () => getAttributes("limit=1000"));

    // etykiety opcji listy potrzebne tylko, gdy sprzęt ma jakąś wartość typu SELECT
    const needsOptions = item?.values.some((value) => value.attributeOptionId !== null) ?? false;
    const options = useAsyncData(needsOptions ? "attributes-options" : null, () => getAttributesOptions("limit=1000"));

    const backLink = (
        <Link href={listHref} className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (equipment.error != null && !item) {
        const notFound = equipment.error instanceof ApiError && equipment.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono sprzętu" : "Nie udało się pobrać sprzętu"}
                    error={equipment.error}
                    onRetry={notFound ? undefined : equipment.retry}
                />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Skeleton className="h-8 w-72" />
                <div className="grid gap-6 lg:grid-cols-5">
                    <Skeleton className="h-64 lg:col-span-2" />
                    <Skeleton className="h-64 lg:col-span-3" />
                </div>
            </div>
        );
    }

    const attributesById = new Map(attributes.data?.data.map((attribute) => [attribute.id, attribute]));
    const optionLabels = new Map(options.data?.data.map((option) => [option.id, option.value]));
    const specsLoading = attributes.loading || (needsOptions && options.loading);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold">{item.name}</h1>
                            <EquipmentStatusBadge status={item.status} />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {item.category.name} · {item.inventoryNumber}
                        </span>
                    </div>

                    {!desk && item.status === "AVAILABLE" && (
                        <Link href={`/my-reservations/new?equipmentId=${item.id}`} className={buttonVariants()}>
                            Zarezerwuj
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Informacje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <DetailField label="Nr inwentarzowy">{item.inventoryNumber}</DetailField>
                            <DetailField label="Nr seryjny">{item.serialNumber ?? "—"}</DetailField>
                            <DetailField label="Kategoria">{item.category.name}</DetailField>
                            <DetailField label="Kod kategorii">{item.category.shortCode}</DetailField>
                            <DetailField label="Dodano">{formatDate(item.createdAt)}</DetailField>
                            {desk && <DetailField label="ID">{item.id}</DetailField>}
                        </dl>
                        {item.category.description && (
                            <p className="mt-4 text-sm text-muted-foreground">{item.category.description}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            Specyfikacja
                            {desk && !editing && (
                                <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditing(true)}>
                                    <Pencil className="h-4 w-4" />
                                    Edytuj
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {editing ? (
                            <EquipmentAttributesEditor
                                equipmentId={item.id}
                                categoryId={item.categoryId}
                                values={item.values}
                                describeValue={(value) => {
                                    const attribute = attributesById.get(value.attributeId);

                                    return {
                                        label: attribute?.name ?? "Atrybut",
                                        text: formatAttributeValue(value, attribute, optionLabels),
                                    };
                                }}
                                onChanged={equipment.retry}
                                onClose={() => setEditing(false)}
                            />
                        ) : item.values.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Brak dodatkowych atrybutów.
                                {desk && " Kliknij „Edytuj”, aby uzupełnić atrybuty kategorii."}
                            </p>
                        ) : specsLoading ? (
                            <div className="flex flex-col gap-2">
                                {item.values.map((value) => (
                                    <Skeleton key={value.id} className="h-6 w-full" />
                                ))}
                            </div>
                        ) : (
                            <dl className="grid gap-4 sm:grid-cols-2">
                                {item.values.map((value) => {
                                    const attribute = attributesById.get(value.attributeId);

                                    return (
                                        <DetailField key={value.id} label={attribute?.name ?? "Atrybut"}>
                                            {formatAttributeValue(value, attribute, optionLabels)}
                                        </DetailField>
                                    );
                                })}
                            </dl>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
