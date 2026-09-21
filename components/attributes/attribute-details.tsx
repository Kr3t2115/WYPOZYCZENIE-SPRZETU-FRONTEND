"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ATTRIBUTE_FIELD_MESSAGES,
    AttributeFieldName,
    AttributeFields,
} from "@/components/attributes/attribute-fields";
import { CategoryUsage } from "@/components/attributes/category-usage";
import { OptionsEditor } from "@/components/attributes/options-editor";
import { AttributeTypeBadge } from "@/components/attributes/type-badge";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { ApiError } from "@/lib/api-client";
import { getById, update } from "@/lib/api/attributes";
import { AttributeType, UpdateAttribute, updateSchema } from "@/lib/validations/attributes";

// /admin/attributes/[id]
export function AttributeDetails({ id }: { id: string }) {
    const attribute = useAsyncData("attribute:" + id, () => getById(id));

    // po zapisie dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = attribute.data ?? (attribute.stale?.id === id ? attribute.stale : undefined);

    // null = bez zmian względem tego, co zapisano w rekordzie
    const [nameDraft, setNameDraft] = useState<string | null>(null);
    const [typeDraft, setTypeDraft] = useState<AttributeType | null>(null);
    const [unitDraft, setUnitDraft] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<AttributeFieldName, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const backLink = (
        <Link
            href="/admin/attributes"
            className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
        >
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (attribute.error != null && !item) {
        const notFound = attribute.error instanceof ApiError && attribute.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono atrybutu" : "Nie udało się pobrać atrybutu"}
                    error={attribute.error}
                    onRetry={notFound ? undefined : attribute.retry}
                />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Skeleton className="h-8 w-72" />
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    const name = nameDraft ?? item.name;
    const type = typeDraft ?? item.type;
    const unit = unitDraft ?? item.unit ?? "";

    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();

    // do API wysyłamy tylko zmienione pola
    const payload: UpdateAttribute = {};
    if (trimmedName !== item.name) payload.name = trimmedName;
    if (type !== item.type) payload.type = type;
    if (trimmedUnit !== (item.unit ?? "") && trimmedUnit !== "") payload.unit = trimmedUnit;

    // backend nie pozwala wyczyścić jednostki (schemat odrzuca pusty string, a brak pola oznacza "bez zmian")
    const clearsUnit = trimmedUnit === "" && item.unit !== null;
    const hasChanges = Object.keys(payload).length > 0 || clearsUnit;

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);
        setSaved(false);

        if (clearsUnit) {
            return setErrors({ unit: "Jednostki nie da się usunąć - wpisz nową wartość albo przywróć poprzednią." });
        }

        const result = updateSchema.safeParse(payload);

        if (!result.success) {
            const nextErrors: Partial<Record<AttributeFieldName, string>> = {};

            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === "name" || field === "type" || field === "unit") {
                    nextErrors[field] ??= ATTRIBUTE_FIELD_MESSAGES[field];
                }
            }

            return setErrors(nextErrors);
        }

        setErrors({});
        setIsSaving(true);

        try {
            await update(id, result.data);
            setNameDraft(null);
            setTypeDraft(null);
            setUnitDraft(null);
            setSaved(true);
            attribute.retry();
        } catch (error) {
            setServerError(getErrorMessage(error, "Nie udało się zapisać zmian."));
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{item.name}</h1>
                    <AttributeTypeBadge type={item.type} />
                    {item.unit && <span className="text-sm text-muted-foreground">({item.unit})</span>}
                </div>
            </div>

            {attribute.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={attribute.error} onRetry={attribute.retry} />
            )}

            <div className="grid items-start gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dane atrybutu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
                            {serverError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{serverError}</AlertDescription>
                                </Alert>
                            )}
                            {saved && !hasChanges && (
                                <Alert>
                                    <AlertDescription>Zapisano zmiany.</AlertDescription>
                                </Alert>
                            )}

                            <AttributeFields
                                name={name}
                                type={type}
                                unit={unit}
                                onNameChange={setNameDraft}
                                onTypeChange={setTypeDraft}
                                onUnitChange={setUnitDraft}
                                errors={errors}
                                disabled={isSaving}
                            />

                            {type !== item.type && (
                                <Alert>
                                    <AlertDescription>
                                        Zmiana typu nie usuwa istniejących opcji listy ani wartości wpisanych przy
                                        sprzęcie - mogą przestać pasować do nowego typu.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-fit" disabled={!hasChanges || isSaving}>
                                {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {item.type === "SELECT" ? (
                    <OptionsEditor attributeId={id} />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Opcje listy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Opcje można dodawać tylko do atrybutów typu „Lista wyboru”. Zmień typ, jeśli ten
                                atrybut ma mieć predefiniowane wartości.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <CategoryUsage attributeId={id} />
        </div>
    );
}
