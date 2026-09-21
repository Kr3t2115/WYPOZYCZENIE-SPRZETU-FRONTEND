"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ATTRIBUTE_TYPE_LABELS } from "@/components/attributes/type-badge";
import { ATTRIBUTE_TYPES, AttributeType } from "@/lib/validations/attributes";

export type AttributeFieldName = "name" | "type" | "unit";

// komunikaty walidacji zgodne z regułami backendu (attribute.schema.js)
export const ATTRIBUTE_FIELD_MESSAGES: Record<AttributeFieldName, string> = {
    name: "Nazwa musi mieć od 3 do 100 znaków",
    type: "Wybierz typ atrybutu",
    unit: "Jednostka może mieć od 1 do 5 znaków",
};

const typeItems = ATTRIBUTE_TYPES.map((type) => ({ value: type, label: ATTRIBUTE_TYPE_LABELS[type] }));

type AttributeFieldsProps = {
    name: string;
    type: AttributeType | null;
    unit: string;
    onNameChange: (value: string) => void;
    onTypeChange: (value: AttributeType) => void;
    onUnitChange: (value: string) => void;
    errors: Partial<Record<AttributeFieldName, string>>;
    disabled?: boolean;
};

export function AttributeFields({
    name,
    type,
    unit,
    onNameChange,
    onTypeChange,
    onUnitChange,
    errors,
    disabled,
}: AttributeFieldsProps) {
    return (
        <>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="attribute-name">Nazwa</Label>
                <Input
                    id="attribute-name"
                    placeholder="np. Pamięć RAM"
                    maxLength={100}
                    value={name}
                    disabled={disabled}
                    aria-invalid={errors.name ? true : undefined}
                    onChange={(e) => onNameChange(e.target.value)}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <Label>Typ</Label>
                    <Select
                        items={typeItems}
                        value={type}
                        disabled={disabled}
                        onValueChange={(value) => value && onTypeChange(value as AttributeType)}
                    >
                        <SelectTrigger className="w-full" aria-invalid={errors.type ? true : undefined}>
                            <SelectValue placeholder="Wybierz typ" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            {typeItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="attribute-unit">Jednostka (opcjonalnie)</Label>
                    <Input
                        id="attribute-unit"
                        placeholder="np. GB"
                        maxLength={5}
                        value={unit}
                        disabled={disabled}
                        aria-invalid={errors.unit ? true : undefined}
                        onChange={(e) => onUnitChange(e.target.value)}
                    />
                    {errors.unit && <p className="text-sm text-destructive">{errors.unit}</p>}
                </div>
            </div>
        </>
    );
}
