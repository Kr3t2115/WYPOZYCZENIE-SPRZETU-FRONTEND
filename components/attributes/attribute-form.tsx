"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ATTRIBUTE_FIELD_MESSAGES,
    AttributeFieldName,
    AttributeFields,
} from "@/components/attributes/attribute-fields";
import { getErrorMessage } from "@/components/query-error";
import { insert } from "@/lib/api/attributes";
import { AttributeType, createSchema } from "@/lib/validations/attributes";

// /admin/attributes/new
export function AttributeForm() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [type, setType] = useState<AttributeType | null>(null);
    const [unit, setUnit] = useState("");
    const [errors, setErrors] = useState<Partial<Record<AttributeFieldName, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = createSchema.safeParse({
            name: name.trim(),
            type: type ?? undefined,
            unit: unit.trim() || undefined,
        });

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
        setIsSubmitting(true);

        try {
            const created = await insert(result.data);
            // opcje listy i przypisanie do kategorii dodaje się już na stronie atrybutu
            router.push(`/admin/attributes/${created.id}`);
        } catch (error) {
            setServerError(getErrorMessage(error, "Nie udało się utworzyć atrybutu. Spróbuj ponownie."));
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                <Link
                    href="/admin/attributes"
                    className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Wróć do listy
                </Link>
                <h1 className="text-2xl font-bold">Nowy atrybut</h1>
            </div>

            <Card className="max-w-xl">
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <AttributeFields
                            name={name}
                            type={type}
                            unit={unit}
                            onNameChange={setName}
                            onTypeChange={setType}
                            onUnitChange={setUnit}
                            errors={errors}
                            disabled={isSubmitting}
                        />

                        {type === "SELECT" && (
                            <p className="text-xs text-muted-foreground">
                                Opcje listy dodasz po utworzeniu atrybutu, na jego stronie.
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Zapisywanie..." : "Utwórz atrybut"}
                            </Button>
                            <Link href="/admin/attributes" className={buttonVariants({ variant: "outline" })}>
                                Anuluj
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
