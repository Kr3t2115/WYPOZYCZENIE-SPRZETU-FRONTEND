"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryAttributesManager } from "@/components/categories/category-attributes-manager";
import {
    CATEGORY_FIELD_MESSAGES,
    CategoryFieldName,
    CategoryFields,
} from "@/components/categories/category-fields";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { ApiError } from "@/lib/api-client";
import { getById, update } from "@/lib/api/category";
import { UpdateCategory, updateSchema } from "@/lib/validations/category";

// /admin/categories/[id]
export function CategoryDetails({ id }: { id: string }) {
    const category = useAsyncData("category:" + id, () => getById(id));

    // po zapisie dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = category.data ?? (category.stale?.id === id ? category.stale : undefined);

    // null = bez zmian względem tego, co zapisano w rekordzie
    const [nameDraft, setNameDraft] = useState<string | null>(null);
    const [shortCodeDraft, setShortCodeDraft] = useState<string | null>(null);
    const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<CategoryFieldName, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const backLink = (
        <Link
            href="/admin/categories"
            className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
        >
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (category.error != null && !item) {
        const notFound = category.error instanceof ApiError && category.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono kategorii" : "Nie udało się pobrać kategorii"}
                    error={category.error}
                    onRetry={notFound ? undefined : category.retry}
                />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-64 max-w-3xl" />
                <Skeleton className="h-64 max-w-3xl" />
            </div>
        );
    }

    const name = nameDraft ?? item.name;
    const shortCode = shortCodeDraft ?? item.shortCode;
    const description = descriptionDraft ?? item.description;

    // do API wysyłamy tylko zmienione pola (m.in. dlatego, że zmiana samej nazwy wymaga sprawdzenia unikalności)
    const payload: UpdateCategory = {};
    if (name.trim() !== item.name) payload.name = name.trim();
    if (shortCode.trim() !== item.shortCode) payload.shortCode = shortCode.trim();
    if (description.trim() !== item.description) payload.description = description.trim();
    const hasChanges = Object.keys(payload).length > 0;

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);
        setSaved(false);

        const result = updateSchema.safeParse(payload);

        if (!result.success) {
            const nextErrors: Partial<Record<CategoryFieldName, string>> = {};

            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === "name" || field === "shortCode" || field === "description") {
                    nextErrors[field] ??= CATEGORY_FIELD_MESSAGES[field];
                }
            }

            return setErrors(nextErrors);
        }

        setErrors({});
        setIsSaving(true);

        try {
            await update(id, result.data);
            setNameDraft(null);
            setShortCodeDraft(null);
            setDescriptionDraft(null);
            setSaved(true);
            category.retry();
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
                    <span className="text-sm text-muted-foreground">{item.shortCode}</span>
                </div>
            </div>

            {category.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={category.error} onRetry={category.retry} />
            )}

            <Card className="max-w-3xl">
                <CardHeader>
                    <CardTitle className="text-base">Dane kategorii</CardTitle>
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

                        <CategoryFields
                            name={name}
                            shortCode={shortCode}
                            description={description}
                            onNameChange={setNameDraft}
                            onShortCodeChange={setShortCodeDraft}
                            onDescriptionChange={setDescriptionDraft}
                            errors={errors}
                            disabled={isSaving}
                        />

                        {shortCode.trim() !== item.shortCode && (
                            <Alert>
                                <AlertDescription>
                                    Zmiana kodu wpłynie tylko na numery inwentarzowe nowo dodawanego sprzętu - już
                                    nadane numery zostają bez zmian.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-fit" disabled={!hasChanges || isSaving}>
                            {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <CategoryAttributesManager categoryId={id} />
        </div>
    );
}
