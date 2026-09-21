"use client"

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAttributesOptions, insert, update } from "@/lib/api/attributes-options";
import { AttributeOption } from "@/lib/validations/attributes-options";

const VALUE_MAX_LENGTH = 100;

type OptionRowProps = {
    option: AttributeOption;
    isFirst: boolean;
    isLast: boolean;
    busy: boolean;
    onMove: (direction: -1 | 1) => void;
    onSaved: () => void;
};

function OptionRow({ option, isFirst, isLast, busy, onMove, onSaved }: OptionRowProps) {
    // null = bez zmian względem tego, co zapisano w rekordzie
    const [draft, setDraft] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const value = draft ?? option.value;
    const changed = value.trim() !== option.value && value.trim() !== "";

    async function handleSave() {
        setIsSaving(true);
        setError(null);

        try {
            await update(option.id, { value: value.trim() });
            setDraft(null);
            onSaved();
        } catch (err) {
            setError(getErrorMessage(err, "Nie udało się zapisać opcji."));
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <li className="flex flex-col gap-1">
            <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (changed) handleSave();
                }}
            >
                <div className="flex flex-col">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Przesuń wyżej"
                        disabled={isFirst || busy}
                        onClick={() => onMove(-1)}
                    >
                        <ArrowUp />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Przesuń niżej"
                        disabled={isLast || busy}
                        onClick={() => onMove(1)}
                    >
                        <ArrowDown />
                    </Button>
                </div>
                <Input
                    aria-label="Wartość opcji"
                    maxLength={VALUE_MAX_LENGTH}
                    value={value}
                    disabled={isSaving}
                    aria-invalid={error ? true : undefined}
                    onChange={(e) => setDraft(e.target.value)}
                />
                <Button type="submit" variant="outline" size="sm" disabled={!changed || isSaving}>
                    {isSaving ? "Zapisywanie..." : "Zapisz"}
                </Button>
            </form>
            {error && <p className="pl-9 text-sm text-destructive">{error}</p>}
        </li>
    );
}

// Opcje atrybutu typu "Lista wyboru". Backend nie ma usuwania opcji, więc edytor dodaje, zmienia nazwę i kolejność.
export function OptionsEditor({ attributeId }: { attributeId: string }) {
    const options = useAsyncData("options:" + attributeId, () =>
        getAttributesOptions(`attributeId=${attributeId}&limit=1000`)
    );

    // przy odświeżaniu lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = options.data ?? options.stale;
    // remisy (nowe opcje mają order 0) rozstrzygamy po id, żeby kolejność nie skakała między odświeżeniami
    const items = [...(response?.data ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

    const [newValue, setNewValue] = useState("");
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [moveError, setMoveError] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAddError(null);

        const value = newValue.trim();
        if (value === "") return setAddError("Wpisz wartość opcji");
        if (items.some((item) => item.value.toLowerCase() === value.toLowerCase())) {
            return setAddError("Taka opcja już istnieje");
        }

        setIsAdding(true);

        try {
            await insert({ attributeId, value });
            setNewValue("");
            options.retry();
        } catch (err) {
            setAddError(getErrorMessage(err, "Nie udało się dodać opcji."));
        } finally {
            setIsAdding(false);
        }
    }

    // Kolejność to pole `order` każdej opcji: po zamianie miejscami nadajemy wszystkim kolejne numery 0..n-1
    // (zapisujemy tylko te, którym się zmieniły) - dzięki temu znikają też remisy z domyślnego order = 0.
    async function handleMove(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;

        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];

        setIsMoving(true);
        setMoveError(null);

        try {
            await Promise.all(
                next.flatMap((option, position) =>
                    option.order !== position ? [update(option.id, { order: position })] : []
                )
            );
            options.retry();
        } catch (err) {
            setMoveError(getErrorMessage(err, "Nie udało się zmienić kolejności."));
        } finally {
            setIsMoving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Opcje listy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {options.error != null && (
                    <QueryError title="Nie udało się pobrać opcji" error={options.error} onRetry={options.retry} />
                )}

                {moveError && (
                    <Alert variant="destructive">
                        <AlertDescription>{moveError}</AlertDescription>
                    </Alert>
                )}

                {!response && options.loading ? (
                    <Skeleton className="h-24 w-full" />
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Brak opcji. Dodaj pierwszą, żeby można było wybierać wartość tego atrybutu przy sprzęcie.
                    </p>
                ) : (
                    <ul className={"flex flex-col gap-2" + (options.loading ? " opacity-60 transition-opacity" : "")}>
                        {items.map((option, index) => (
                            <OptionRow
                                key={option.id}
                                option={option}
                                isFirst={index === 0}
                                isLast={index === items.length - 1}
                                busy={isMoving}
                                onMove={(direction) => handleMove(index, direction)}
                                onSaved={options.retry}
                            />
                        ))}
                    </ul>
                )}

                <form onSubmit={handleAdd} className="flex flex-col gap-1 border-t pt-4">
                    <div className="flex gap-2">
                        <Input
                            aria-label="Nowa opcja"
                            placeholder="Nowa opcja, np. 16 GB"
                            maxLength={VALUE_MAX_LENGTH}
                            value={newValue}
                            disabled={isAdding}
                            aria-invalid={addError ? true : undefined}
                            onChange={(e) => setNewValue(e.target.value)}
                        />
                        <Button type="submit" className="gap-1" disabled={isAdding}>
                            <Plus className="h-4 w-4" />
                            {isAdding ? "Dodawanie..." : "Dodaj"}
                        </Button>
                    </div>
                    {addError && <p className="text-sm text-destructive">{addError}</p>}
                </form>
            </CardContent>
        </Card>
    );
}
