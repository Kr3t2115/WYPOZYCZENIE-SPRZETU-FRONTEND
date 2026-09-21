"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttributePicker, PickedAttribute } from "@/components/categories/attribute-picker";
import {
    CATEGORY_FIELD_MESSAGES,
    CategoryFieldName,
    CategoryFields,
} from "@/components/categories/category-fields";
import { getErrorMessage } from "@/components/query-error";
import { insert } from "@/lib/api/category";
import { insert as insertCategoryAttribute } from "@/lib/api/category-attributes";
import { createSchema } from "@/lib/validations/category";

type CreatedState = { id: string; failures: string[] };

// /admin/categories/new - kategoria wraz z przypisaniem atrybutów
export function CategoryForm() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [shortCode, setShortCode] = useState("");
    const [description, setDescription] = useState("");
    const [picked, setPicked] = useState<PickedAttribute[]>([]);
    const [errors, setErrors] = useState<Partial<Record<CategoryFieldName, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState<string | null>(null);
    // kategoria już istnieje, ale część atrybutów się nie przypisała - nie można wysłać formularza drugi raz
    const [created, setCreated] = useState<CreatedState | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = createSchema.safeParse({
            name: name.trim(),
            shortCode: shortCode.trim(),
            description: description.trim(),
        });

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
        setIsSubmitting(true);

        let categoryId: string;

        try {
            const category = await insert(result.data);
            categoryId = category.id;
        } catch (error) {
            setServerError(getErrorMessage(error, "Nie udało się utworzyć kategorii. Spróbuj ponownie."));
            setIsSubmitting(false);
            return;
        }

        // Backend nadaje `order` przypisania jako liczbę dotychczasowych atrybutów + 1, więc równoległe zapytania
        // dostałyby ten sam numer - przypisujemy po kolei, w kolejności z listy.
        const failures: string[] = [];

        for (const [index, item] of picked.entries()) {
            setProgress(`Przypisywanie atrybutów (${index + 1}/${picked.length})...`);

            try {
                await insertCategoryAttribute({
                    categoryId,
                    attributeId: item.attribute.id,
                    required: item.required,
                });
            } catch (error) {
                failures.push(`${item.attribute.name}: ${getErrorMessage(error, "nie udało się przypisać")}`);
            }
        }

        setProgress(null);

        if (failures.length === 0) {
            router.push(`/admin/categories/${categoryId}`);
            return;
        }

        setCreated({ id: categoryId, failures });
        setIsSubmitting(false);
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/categories"
                    className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Wróć do listy
                </Link>
                <h1 className="text-2xl font-bold">Nowa kategoria</h1>
            </div>

            {created && (
                <Alert variant="destructive">
                    <AlertTitle>Kategoria została utworzona, ale nie wszystkie atrybuty się przypisały</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5">
                            {created.failures.map((failure) => (
                                <li key={failure}>{failure}</li>
                            ))}
                        </ul>
                        <Link
                            href={`/admin/categories/${created.id}`}
                            className={buttonVariants({ variant: "outline", size: "sm" }) + " mt-3 w-fit"}
                        >
                            Przejdź do kategorii i dokończ przypisanie
                        </Link>
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle className="text-base">Dane kategorii</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <CategoryFields
                            name={name}
                            shortCode={shortCode}
                            description={description}
                            onNameChange={setName}
                            onShortCodeChange={setShortCode}
                            onDescriptionChange={setDescription}
                            errors={errors}
                            disabled={isSubmitting}
                        />
                    </CardContent>
                </Card>

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle className="text-base">Atrybuty kategorii</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Wybierz, jakimi cechami opisujesz sprzęt z tej kategorii. „Wymagany” oznacza, że wartość
                            trzeba podać przy dodawaniu sprzętu.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <AttributePicker value={picked} onChange={setPicked} disabled={isSubmitting} />
                    </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={isSubmitting || created !== null}>
                        {progress ?? (isSubmitting ? "Zapisywanie..." : "Utwórz kategorię")}
                    </Button>
                    <Link href="/admin/categories" className={buttonVariants({ variant: "outline" })}>
                        Anuluj
                    </Link>
                </div>
            </form>
        </div>
    );
}
