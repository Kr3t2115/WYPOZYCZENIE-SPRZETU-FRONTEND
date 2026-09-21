"use client"

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttributeTypeBadge } from "@/components/attributes/type-badge";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getAttributes } from "@/lib/api/attributes";
import { getCategoryAttributes, insert, remove, update } from "@/lib/api/category-attributes";
import { CategoryAttributeDetails } from "@/lib/validations/category-attributes";

type RowProps = {
    item: CategoryAttributeDetails;
    isFirst: boolean;
    isLast: boolean;
    busy: boolean;
    onMove: (direction: -1 | 1) => void;
    onChanged: () => void;
};

function AttributeRow({ item, isFirst, isLast, busy, onMove, onChanged }: RowProps) {
    const [isBusy, setIsBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function run(action: () => Promise<unknown>, fallbackError: string) {
        setIsBusy(true);
        setError(null);

        try {
            await action();
            setConfirming(false);
            onChanged();
        } catch (err) {
            setError(getErrorMessage(err, fallbackError));
        } finally {
            setIsBusy(false);
        }
    }

    const disabled = isBusy || busy;

    return (
        <>
            <TableRow>
                <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-label="Przesuń wyżej"
                                disabled={isFirst || disabled}
                                onClick={() => onMove(-1)}
                            >
                                <ArrowUp />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-label="Przesuń niżej"
                                disabled={isLast || disabled}
                                onClick={() => onMove(1)}
                            >
                                <ArrowDown />
                            </Button>
                        </div>
                        <span className="font-medium">
                            {item.attribute.name}
                            {item.attribute.unit && (
                                <span className="ml-1 font-normal text-muted-foreground">({item.attribute.unit})</span>
                            )}
                        </span>
                    </div>
                </TableCell>
                <TableCell>
                    <AttributeTypeBadge type={item.attribute.type} />
                </TableCell>
                <TableCell>
                    <Checkbox
                        aria-label={`Wymagany: ${item.attribute.name}`}
                        checked={item.required}
                        disabled={disabled}
                        // required wysyłamy jawnie - schemat update na backendzie domyślnie ustawia je na true
                        onCheckedChange={(checked) =>
                            run(() => update(item.id, { required: checked }), "Nie udało się zmienić ustawienia.")
                        }
                    />
                </TableCell>
                <TableCell className="text-right">
                    {confirming ? (
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={disabled}
                                onClick={() => run(() => remove(item.id), "Nie udało się odpiąć atrybutu.")}
                            >
                                {isBusy ? "Usuwanie..." : "Tak, odepnij"}
                            </Button>
                            <Button size="sm" variant="outline" disabled={disabled} onClick={() => setConfirming(false)}>
                                Wróć
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={disabled}
                            onClick={() => {
                                setError(null);
                                setConfirming(true);
                            }}
                        >
                            Odepnij
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            {error && (
                <TableRow>
                    <TableCell colSpan={4}>
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

// Atrybuty przypisane do kategorii (strona /admin/categories/[id]) - to samo powiązanie, co na stronie atrybutu,
// tylko oglądane od strony kategorii i z możliwością zmiany kolejności.
export function CategoryAttributesManager({ categoryId }: { categoryId: string }) {
    const assigned = useAsyncData("category-attributes:" + categoryId, () =>
        getCategoryAttributes(`categoryId=${categoryId}&limit=1000`)
    );
    const attributes = useAsyncData("attributes:all", () => getAttributes("limit=1000"));

    // przy odświeżaniu lista zostaje na ekranie do czasu nowej odpowiedzi (backend zwraca ją posortowaną po `order`)
    const response = assigned.data ?? assigned.stale;
    const items = [...(response?.data ?? [])].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

    const taken = new Set(items.map((item) => item.attributeId));
    const available = (attributes.data?.data ?? [])
        .filter((attribute) => !taken.has(attribute.id))
        .sort((a, b) => a.name.localeCompare(b.name, "pl"));
    const attributeItems = available.map((attribute) => ({ value: attribute.id, label: attribute.name }));

    const [attributeId, setAttributeId] = useState<string | null>(null);
    const [required, setRequired] = useState(true);
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [moveError, setMoveError] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAddError(null);

        if (!attributeId) return setAddError("Wybierz atrybut");

        setIsAdding(true);

        try {
            await insert({ categoryId, attributeId, required });
            setAttributeId(null);
            setRequired(true);
            assigned.retry();
        } catch (err) {
            setAddError(getErrorMessage(err, "Nie udało się przypisać atrybutu."));
        } finally {
            setIsAdding(false);
        }
    }

    // Kolejność to pole `order` przypisania: po zamianie miejscami nadajemy kolejne numery 1..n (jak backend przy
    // tworzeniu). `required` wysyłamy razem z `order`, bo schemat update nadpisałby je domyślnym `true`.
    async function handleMove(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;

        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];

        setIsMoving(true);
        setMoveError(null);

        try {
            await Promise.all(
                next.flatMap((item, position) =>
                    item.order !== position + 1 ? [update(item.id, { order: position + 1, required: item.required })] : []
                )
            );
            assigned.retry();
        } catch (err) {
            setMoveError(getErrorMessage(err, "Nie udało się zmienić kolejności."));
        } finally {
            setIsMoving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Atrybuty kategorii</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Cechy opisujące sprzęt z tej kategorii. Kolejność wpływa na to, jak są wyświetlane przy sprzęcie.
                </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {assigned.error != null && (
                    <QueryError title="Nie udało się pobrać atrybutów" error={assigned.error} onRetry={assigned.retry} />
                )}

                {moveError && (
                    <Alert variant="destructive">
                        <AlertDescription>{moveError}</AlertDescription>
                    </Alert>
                )}

                <Table className={assigned.loading && response ? "opacity-60 transition-opacity" : undefined}>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Atrybut</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Wymagany</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!response && assigned.loading ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Skeleton className="h-6 w-full" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                    Do tej kategorii nie przypisano jeszcze żadnych atrybutów.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <AttributeRow
                                    key={item.id}
                                    item={item}
                                    isFirst={index === 0}
                                    isLast={index === items.length - 1}
                                    busy={isMoving}
                                    onMove={(direction) => handleMove(index, direction)}
                                    onChanged={assigned.retry}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>

                <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t pt-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Label>Przypisz atrybut</Label>
                            <Select
                                items={attributeItems}
                                value={attributeId}
                                disabled={isAdding || !attributes.data}
                                onValueChange={setAttributeId}
                            >
                                <SelectTrigger className="w-full" aria-invalid={addError ? true : undefined}>
                                    <SelectValue
                                        placeholder={
                                            !attributes.data
                                                ? "Ładowanie..."
                                                : available.length === 0
                                                  ? "Wszystkie atrybuty przypisane"
                                                  : "Wybierz atrybut"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {attributeItems.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Label className="flex h-9 items-center gap-2 font-normal">
                            <Checkbox checked={required} disabled={isAdding} onCheckedChange={setRequired} />
                            Wymagany
                        </Label>

                        <Button type="submit" disabled={isAdding || available.length === 0}>
                            {isAdding ? "Przypisywanie..." : "Przypisz"}
                        </Button>
                    </div>
                    {addError && <p className="text-sm text-destructive">{addError}</p>}
                </form>
            </CardContent>
        </Card>
    );
}
