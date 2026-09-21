"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AttributeValueField } from "@/components/equipment/attribute-value-field";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAttributesOptions } from "@/lib/api/attributes-options";
import { getCategories } from "@/lib/api/category";
import { getCategoryAttributes } from "@/lib/api/category-attributes";
import { insert } from "@/lib/api/equipment";
import { insert as insertAttributeValue } from "@/lib/api/equipment-attributes";
import { toAttributePayload } from "@/lib/equipment-attribute-values";
import { AttributeOption } from "@/lib/validations/attributes-options";
import { CreateEquipmentAttribute } from "@/lib/validations/equipment-attributes";
import { createSchema } from "@/lib/validations/equipment";

type Field = "name" | "serialNumber" | "categoryId";

const FIELD_MESSAGES: Record<Field, string> = {
    name: "Nazwa musi mieć od 3 do 100 znaków",
    serialNumber: "Numer seryjny musi mieć od 3 do 100 znaków",
    categoryId: "Wybierz kategorię",
};

type CreatedState = { id: string; inventoryNumber: string; failures: string[] };

// /admin/equipment/new - nowy sprzęt wraz z wartościami atrybutów jego kategorii
export function EquipmentForm() {
    const router = useRouter();

    const categories = useAsyncData("categories", () => getCategories("limit=1000"));

    const [name, setName] = useState("");
    const [serialNumber, setSerialNumber] = useState("");
    const [categoryId, setCategoryId] = useState<string | null>(null);
    // wartości atrybutów po id atrybutu (patrz AttributeValueField)
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [valueErrors, setValueErrors] = useState<Record<string, string>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    // sprzęt już istnieje, ale część wartości się nie zapisała - nie można wysłać formularza drugi raz
    const [created, setCreated] = useState<CreatedState | null>(null);

    // atrybuty wybranej kategorii (backend zwraca je posortowane po `order`)
    const categoryAttributes = useAsyncData(categoryId ? "category-attributes:" + categoryId : null, () =>
        getCategoryAttributes(`categoryId=${categoryId}&limit=1000`)
    );
    const attributeItems = categoryAttributes.data?.data ?? [];

    // opcje list pobieramy tylko wtedy, gdy kategoria ma atrybut typu SELECT
    const needsOptions = attributeItems.some((item) => item.attribute.type === "SELECT");
    const options = useAsyncData(needsOptions ? "attributes-options:all" : null, () =>
        getAttributesOptions("limit=1000")
    );

    const optionsByAttribute = new Map<string, AttributeOption[]>();
    for (const option of [...(options.data?.data ?? [])].sort((a, b) => a.order - b.order)) {
        optionsByAttribute.set(option.attributeId, [...(optionsByAttribute.get(option.attributeId) ?? []), option]);
    }

    const categoryItems = (categories.data?.data ?? []).map((category) => ({
        value: category.id,
        label: `${category.name} (${category.shortCode})`,
    }));

    const attributesLoading = categoryId !== null && (categoryAttributes.loading || (needsOptions && options.loading));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = createSchema.safeParse({
            name: name.trim(),
            serialNumber: serialNumber.trim(),
            categoryId: categoryId ?? undefined,
        });

        const nextErrors: Partial<Record<Field, string>> = {};
        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === "name" || field === "serialNumber" || field === "categoryId") {
                    nextErrors[field] ??= FIELD_MESSAGES[field];
                }
            }
        }

        // wartości atrybutów: wymagane muszą być wypełnione, liczby muszą być liczbami
        const nextValueErrors: Record<string, string> = {};
        const payloads: { name: string; data: CreateEquipmentAttribute }[] = [];

        for (const item of attributeItems) {
            const payload = toAttributePayload(item, values[item.attributeId] ?? "");

            if (payload.kind === "empty") {
                if (item.required) nextValueErrors[item.attributeId] = "To pole jest wymagane";
            } else if (payload.kind === "error") {
                nextValueErrors[item.attributeId] = payload.message;
            } else {
                payloads.push({ name: item.attribute.name, data: payload.data });
            }
        }

        setErrors(nextErrors);
        setValueErrors(nextValueErrors);

        if (!result.success || Object.keys(nextValueErrors).length > 0) return;

        setIsSubmitting(true);

        let equipmentId: string;
        let inventoryNumber: string;

        try {
            const equipment = await insert(result.data);
            equipmentId = equipment.id;
            inventoryNumber = equipment.inventoryNumber;
        } catch (error) {
            setServerError(getErrorMessage(error, "Nie udało się dodać sprzętu. Spróbuj ponownie."));
            setIsSubmitting(false);
            return;
        }

        // wartości atrybutów zapisujemy po utworzeniu sprzętu, po jednej (osobny endpoint na każdy atrybut)
        const failures: string[] = [];

        for (const [index, payload] of payloads.entries()) {
            setProgress(`Zapisywanie atrybutów (${index + 1}/${payloads.length})...`);

            try {
                await insertAttributeValue(equipmentId, payload.data);
            } catch (error) {
                failures.push(`${payload.name}: ${getErrorMessage(error, "nie udało się zapisać")}`);
            }
        }

        setProgress(null);

        if (failures.length === 0) {
            router.push(`/desk/inventory/${equipmentId}`);
            return;
        }

        setCreated({ id: equipmentId, inventoryNumber, failures });
        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                <Link
                    href="/desk/inventory"
                    className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Wróć do inwentarza
                </Link>
                <h1 className="text-2xl font-bold">Nowy sprzęt</h1>
            </div>

            {created && (
                <Alert variant="destructive">
                    <AlertTitle>
                        Sprzęt został dodany ({created.inventoryNumber}), ale nie wszystkie atrybuty się zapisały
                    </AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5">
                            {created.failures.map((failure) => (
                                <li key={failure}>{failure}</li>
                            ))}
                        </ul>
                        <Link
                            href={`/desk/inventory/${created.id}`}
                            className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-3 w-fit"}
                        >
                            Przejdź do sprzętu
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle className="text-base">Dane sprzętu</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="equipment-name">Nazwa</Label>
                                <Input
                                    id="equipment-name"
                                    placeholder="np. Dell Latitude 5420"
                                    maxLength={100}
                                    value={name}
                                    disabled={isSubmitting}
                                    aria-invalid={errors.name ? true : undefined}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="equipment-serial">Numer seryjny</Label>
                                <Input
                                    id="equipment-serial"
                                    maxLength={100}
                                    value={serialNumber}
                                    disabled={isSubmitting}
                                    aria-invalid={errors.serialNumber ? true : undefined}
                                    onChange={(e) => setSerialNumber(e.target.value)}
                                />
                                {errors.serialNumber && <p className="text-sm text-destructive">{errors.serialNumber}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Kategoria</Label>
                            {categories.error != null ? (
                                <QueryError
                                    title="Nie udało się pobrać kategorii"
                                    error={categories.error}
                                    onRetry={categories.retry}
                                />
                            ) : (
                                <Select
                                    items={categoryItems}
                                    value={categoryId}
                                    disabled={isSubmitting || !categories.data}
                                    onValueChange={(next) => {
                                        setCategoryId(next);
                                        setValueErrors({});
                                    }}
                                >
                                    <SelectTrigger
                                        className="w-full sm:w-96"
                                        aria-invalid={errors.categoryId ? true : undefined}
                                    >
                                        <SelectValue
                                            placeholder={
                                                !categories.data
                                                    ? "Ładowanie..."
                                                    : categoryItems.length === 0
                                                      ? "Brak kategorii"
                                                      : "Wybierz kategorię"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent alignItemWithTrigger={false}>
                                        {categoryItems.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
                            {categories.data && categoryItems.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Najpierw{" "}
                                    <Link href="/admin/categories/new" className="underline">
                                        utwórz kategorię
                                    </Link>
                                    .
                                </p>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Numer inwentarzowy zostanie nadany automatycznie na podstawie kodu kategorii.
                        </p>
                    </CardContent>
                </Card>

                {categoryId && (
                    <Card className="max-w-3xl">
                        <CardHeader>
                            <CardTitle className="text-base">Atrybuty</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Pola oznaczone * są wymagane w tej kategorii.
                            </p>
                        </CardHeader>
                        <CardContent>
                            {categoryAttributes.error != null ? (
                                <QueryError
                                    title="Nie udało się pobrać atrybutów kategorii"
                                    error={categoryAttributes.error}
                                    onRetry={categoryAttributes.retry}
                                />
                            ) : attributesLoading ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Skeleton className="h-16" />
                                    <Skeleton className="h-16" />
                                </div>
                            ) : attributeItems.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Ta kategoria nie ma jeszcze przypisanych atrybutów.{" "}
                                    <Link href={`/admin/categories/${categoryId}`} className="underline">
                                        Dodaj je w ustawieniach kategorii
                                    </Link>
                                    .
                                </p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {attributeItems.map((item) => (
                                        <AttributeValueField
                                            key={item.id}
                                            item={item}
                                            value={values[item.attributeId] ?? ""}
                                            options={optionsByAttribute.get(item.attributeId) ?? []}
                                            error={valueErrors[item.attributeId]}
                                            disabled={isSubmitting}
                                            onChange={(next) => setValues((prev) => ({ ...prev, [item.attributeId]: next }))}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={isSubmitting || attributesLoading || created !== null}>
                        {progress ?? (isSubmitting ? "Zapisywanie..." : "Dodaj sprzęt")}
                    </Button>
                    <Link href="/desk/inventory" className={buttonVariants({ variant: "outline" })}>
                        Anuluj
                    </Link>
                </div>
            </form>
        </div>
    );
}
