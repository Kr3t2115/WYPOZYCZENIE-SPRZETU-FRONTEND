"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CategoryFieldName = "name" | "shortCode" | "description";

// komunikaty walidacji zgodne z regułami backendu (category.schema.js)
export const CATEGORY_FIELD_MESSAGES: Record<CategoryFieldName, string> = {
    name: "Nazwa musi mieć od 3 do 100 znaków",
    shortCode: "Kod musi mieć od 3 do 5 znaków",
    description: "Opis musi mieć od 3 do 500 znaków",
};

type CategoryFieldsProps = {
    name: string;
    shortCode: string;
    description: string;
    onNameChange: (value: string) => void;
    onShortCodeChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    errors: Partial<Record<CategoryFieldName, string>>;
    disabled?: boolean;
};

export function CategoryFields({
    name,
    shortCode,
    description,
    onNameChange,
    onShortCodeChange,
    onDescriptionChange,
    errors,
    disabled,
}: CategoryFieldsProps) {
    return (
        <>
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="category-name">Nazwa</Label>
                    <Input
                        id="category-name"
                        placeholder="np. Laptopy"
                        maxLength={100}
                        value={name}
                        disabled={disabled}
                        aria-invalid={errors.name ? true : undefined}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category-short-code">Kod</Label>
                    <Input
                        id="category-short-code"
                        placeholder="np. LAP"
                        maxLength={5}
                        value={shortCode}
                        disabled={disabled}
                        aria-invalid={errors.shortCode ? true : undefined}
                        // backend zapisuje kod wielkimi literami, więc od razu tak go pokazujemy
                        onChange={(e) => onShortCodeChange(e.target.value.toUpperCase())}
                    />
                    {errors.shortCode && <p className="text-sm text-destructive">{errors.shortCode}</p>}
                </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
                Kod trafia do numerów inwentarzowych sprzętu z tej kategorii, np. SAN/{shortCode || "LAP"}/000001.
            </p>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="category-description">Opis</Label>
                <Textarea
                    id="category-description"
                    placeholder="Jaki sprzęt zawiera ta kategoria?"
                    maxLength={500}
                    value={description}
                    disabled={disabled}
                    aria-invalid={errors.description ? true : undefined}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
        </>
    );
}
