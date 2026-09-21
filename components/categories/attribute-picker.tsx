"use client"

import Link from "next/link";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AttributeTypeBadge } from "@/components/attributes/type-badge";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAttributes } from "@/lib/api/attributes";
import { Attribute } from "@/lib/validations/attributes";

export type PickedAttribute = { attribute: Attribute; required: boolean };

type AttributePickerProps = {
    value: PickedAttribute[];
    onChange: (value: PickedAttribute[]) => void;
    disabled?: boolean;
};

// Wybór atrybutów przypisywanych do nowej kategorii. Kolejność na liście to kolejność przypisania
// (backend nadaje `order` w kolejności tworzenia), a "wymagany" oznacza, że wartość trzeba podać przy sprzęcie.
export function AttributePicker({ value, onChange, disabled }: AttributePickerProps) {
    const attributes = useAsyncData("attributes:all", () => getAttributes("limit=1000"));

    const chosen = new Set(value.map((item) => item.attribute.id));
    const available = (attributes.data?.data ?? [])
        .filter((attribute) => !chosen.has(attribute.id))
        .sort((a, b) => a.name.localeCompare(b.name, "pl"));
    const items = available.map((attribute) => ({ value: attribute.id, label: attribute.name }));

    function move(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= value.length) return;

        const next = [...value];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    }

    return (
        <div className="flex flex-col gap-3">
            {attributes.error != null && (
                <QueryError title="Nie udało się pobrać atrybutów" error={attributes.error} onRetry={attributes.retry} />
            )}

            {value.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Nie wybrano żadnych atrybutów. Możesz dodać je teraz albo później, na stronie kategorii.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {value.map((item, index) => (
                        <li key={item.attribute.id} className="flex items-center gap-2 rounded-lg border p-2">
                            <div className="flex flex-col">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Przesuń wyżej"
                                    disabled={disabled || index === 0}
                                    onClick={() => move(index, -1)}
                                >
                                    <ArrowUp />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Przesuń niżej"
                                    disabled={disabled || index === value.length - 1}
                                    onClick={() => move(index, 1)}
                                >
                                    <ArrowDown />
                                </Button>
                            </div>

                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                    {item.attribute.name}
                                    {item.attribute.unit && (
                                        <span className="ml-1 font-normal text-muted-foreground">
                                            ({item.attribute.unit})
                                        </span>
                                    )}
                                </span>
                                <AttributeTypeBadge type={item.attribute.type} />
                            </div>

                            <Label className="flex items-center gap-2 text-sm font-normal">
                                <Checkbox
                                    checked={item.required}
                                    disabled={disabled}
                                    onCheckedChange={(checked) =>
                                        onChange(
                                            value.map((current, currentIndex) =>
                                                currentIndex === index ? { ...current, required: checked } : current
                                            )
                                        )
                                    }
                                />
                                Wymagany
                            </Label>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Usuń ${item.attribute.name}`}
                                disabled={disabled}
                                onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
                            >
                                <X />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex flex-col gap-1.5">
                <Label>Dodaj atrybut</Label>
                {!attributes.data && attributes.loading ? (
                    <Skeleton className="h-9 w-full sm:w-72" />
                ) : (attributes.data?.data.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nie ma jeszcze żadnych atrybutów.{" "}
                        <Link href="/admin/attributes/new" className="underline">
                            Utwórz pierwszy
                        </Link>
                        .
                    </p>
                ) : (
                    <Select
                        items={items}
                        value={null}
                        disabled={disabled || available.length === 0}
                        // wybrany atrybut od razu trafia na listę wyżej, a select wraca do stanu pustego
                        onValueChange={(id) => {
                            const attribute = available.find((candidate) => candidate.id === id);
                            if (attribute) onChange([...value, { attribute, required: true }]);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-72">
                            <SelectValue
                                placeholder={available.length === 0 ? "Wszystkie atrybuty dodane" : "Wybierz atrybut"}
                            />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                            {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
}
