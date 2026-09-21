"use client"

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { ApiError } from "@/lib/api-client";
import { getById } from "@/lib/api/equipment";
import { getAttributes } from "@/lib/api/attributes";
import { getAttributesOptions } from "@/lib/api/attributes-options";
import { Attribute } from "@/lib/validations/attributes";
import { EquipmentAttributeValue } from "@/lib/validations/equipment";

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{children}</dd>
        </div>
    );
}

// "user" - /equipment/[id] (student), "desk" - /desk/inventory/[id] (IT_STAFF / SECRETARIAT)
export function EquipmentDetails({ id, mode }: { id: string; mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const listHref = desk ? "/desk/inventory" : "/equipment";

    const equipment = useAsyncData("equipment:" + id, () => getById(id));
    const attributes = useAsyncData("attributes", () => getAttributes("limit=1000"));

    // etykiety opcji listy potrzebne tylko, gdy sprzęt ma jakąś wartość typu SELECT
    const needsOptions = equipment.data?.values.some((value) => value.attributeOptionId !== null) ?? false;
    const options = useAsyncData(needsOptions ? "attributes-options" : null, () => getAttributesOptions("limit=1000"));

    const backLink = (
        <Link href={listHref} className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (equipment.error != null) {
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

    if (!equipment.data) {
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

    const item = equipment.data;

    const attributesById = new Map(attributes.data?.data.map((attribute) => [attribute.id, attribute]));
    const optionLabels = new Map(options.data?.data.map((option) => [option.id, option.value]));
    const specsLoading = attributes.loading || (needsOptions && options.loading);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold">{item.name}</h1>
                        <EquipmentStatusBadge status={item.status} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {item.category.name} · {item.inventoryNumber}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Informacje</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <Field label="Nr inwentarzowy">{item.inventoryNumber}</Field>
                            <Field label="Nr seryjny">{item.serialNumber ?? "—"}</Field>
                            <Field label="Kategoria">{item.category.name}</Field>
                            <Field label="Kod kategorii">{item.category.shortCode}</Field>
                            <Field label="Dodano">{formatDate(item.createdAt)}</Field>
                            {desk && <Field label="ID">{item.id}</Field>}
                        </dl>
                        {item.category.description && (
                            <p className="mt-4 text-sm text-muted-foreground">{item.category.description}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base">Specyfikacja</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {item.values.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Brak dodatkowych atrybutów.</p>
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
                                        <Field key={value.id} label={attribute?.name ?? "Atrybut"}>
                                            {formatAttributeValue(value, attribute, optionLabels)}
                                        </Field>
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
