"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { AttributeOption } from "@/lib/validations/attributes-options";
import { CategoryAttributeDetails } from "@/lib/validations/category-attributes";

const VALUE_MAX_LENGTH = 255;

const booleanItems = [
    { value: "true", label: "Tak" },
    { value: "false", label: "Nie" },
];

type AttributeValueFieldProps = {
    item: CategoryAttributeDetails;
    // TEXT/NUMBER -> wpisany tekst, DATE -> "yyyy-mm-dd", BOOLEAN -> "true"/"false", SELECT -> id opcji
    value: string;
    onChange: (value: string) => void;
    // opcje listy (tylko dla atrybutu typu SELECT)
    options: AttributeOption[];
    error?: string;
    disabled?: boolean;
    // czy pokazać "Wyczyść" dla pola opcjonalnego (domyślnie tak)
    clearable?: boolean;
};

// Pole wartości atrybutu sprzętu dopasowane do typu atrybutu
export function AttributeValueField({
    item,
    value,
    onChange,
    options,
    error,
    disabled,
    clearable = true,
}: AttributeValueFieldProps) {
    const { attribute, required } = item;
    const inputId = `attribute-${attribute.id}`;
    const selectItems = options.map((option) => ({ value: option.id, label: option.value }));

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor={inputId}>
                    {attribute.name}
                    {attribute.unit && <span className="font-normal text-muted-foreground">({attribute.unit})</span>}
                    {required && <span className="text-destructive"> *</span>}
                </Label>
                {!required && clearable && value !== "" && (
                    <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="h-auto p-0"
                        disabled={disabled}
                        onClick={() => onChange("")}
                    >
                        Wyczyść
                    </Button>
                )}
            </div>

            {attribute.type === "TEXT" && (
                <Input
                    id={inputId}
                    maxLength={VALUE_MAX_LENGTH}
                    value={value}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}

            {attribute.type === "NUMBER" && (
                <Input
                    id={inputId}
                    inputMode="decimal"
                    placeholder="np. 16"
                    maxLength={VALUE_MAX_LENGTH}
                    value={value}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}

            {attribute.type === "DATE" && (
                <DatePicker
                    id={inputId}
                    value={value}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                    onChange={onChange}
                />
            )}

            {attribute.type === "BOOLEAN" && (
                <Select
                    items={booleanItems}
                    value={value || null}
                    disabled={disabled}
                    onValueChange={(next) => onChange(next ?? "")}
                >
                    <SelectTrigger id={inputId} className="w-full" aria-invalid={error ? true : undefined}>
                        <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        {booleanItems.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {attribute.type === "SELECT" && (
                <Select
                    items={selectItems}
                    value={value || null}
                    disabled={disabled || selectItems.length === 0}
                    onValueChange={(next) => onChange(next ?? "")}
                >
                    <SelectTrigger id={inputId} className="w-full" aria-invalid={error ? true : undefined}>
                        <SelectValue placeholder={selectItems.length === 0 ? "Brak opcji do wyboru" : "Wybierz"} />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                        {selectItems.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
