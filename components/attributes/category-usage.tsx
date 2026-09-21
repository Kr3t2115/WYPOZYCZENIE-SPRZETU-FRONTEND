"use client"

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getCategories } from "@/lib/api/category";
import { getCategoryAttributes, insert, remove, update } from "@/lib/api/category-attributes";
import { CategoryAttributeDetails } from "@/lib/validations/category-attributes";

function UsageRow({ item, onChanged }: { item: CategoryAttributeDetails; onChanged: () => void }) {
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

    return (
        <>
            <TableRow>
                <TableCell className="font-medium">
                    {item.category.name}
                    <span className="ml-2 text-xs text-muted-foreground">{item.category.shortCode}</span>
                </TableCell>
                <TableCell>
                    <Checkbox
                        aria-label={`Wymagany w kategorii ${item.category.name}`}
                        checked={item.required}
                        disabled={isBusy}
                        // required wysyłamy zawsze jawnie - schemat update na backendzie domyślnie ustawia je na true
                        onCheckedChange={(checked) =>
                            run(() => update(item.id, { required: checked }), "Nie udało się zmienić ustawienia.")
                        }
                    />
                </TableCell>
                <TableCell className="text-muted-foreground">{item.order}</TableCell>
                <TableCell className="text-right">
                    {confirming ? (
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={isBusy}
                                onClick={() => run(() => remove(item.id), "Nie udało się odpiąć atrybutu.")}
                            >
                                {isBusy ? "Usuwanie..." : "Tak, odepnij"}
                            </Button>
                            <Button size="sm" variant="outline" disabled={isBusy} onClick={() => setConfirming(false)}>
                                Wróć
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
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

// Kategorie, w których używany jest atrybut (relacja kategoria <-> atrybut z flagą "wymagany")
export function CategoryUsage({ attributeId }: { attributeId: string }) {
    const usage = useAsyncData("category-attributes:" + attributeId, () =>
        getCategoryAttributes(`attributeId=${attributeId}&limit=1000`)
    );
    const categories = useAsyncData("categories", () => getCategories("limit=1000"));

    // przy odświeżaniu lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = usage.data ?? usage.stale;
    const items = [...(response?.data ?? [])].sort((a, b) => a.category.name.localeCompare(b.category.name, "pl"));

    const assigned = new Set(items.map((item) => item.categoryId));
    const available = (categories.data?.data ?? []).filter((category) => !assigned.has(category.id));
    const categoryItems = available.map((category) => ({ value: category.id, label: category.name }));

    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [required, setRequired] = useState(true);
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAddError(null);

        if (!categoryId) return setAddError("Wybierz kategorię");

        setIsAdding(true);

        try {
            await insert({ categoryId, attributeId, required });
            setCategoryId(null);
            setRequired(true);
            usage.retry();
        } catch (err) {
            setAddError(getErrorMessage(err, "Nie udało się przypisać atrybutu do kategorii."));
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Użycie w kategoriach</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Atrybut pojawi się przy sprzęcie z tych kategorii. „Wymagany” oznacza, że wartość trzeba podać.
                </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {usage.error != null && (
                    <QueryError title="Nie udało się pobrać kategorii" error={usage.error} onRetry={usage.retry} />
                )}

                <Table className={usage.loading && response ? "opacity-60 transition-opacity" : undefined}>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kategoria</TableHead>
                            <TableHead>Wymagany</TableHead>
                            <TableHead>Kolejność</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!response && usage.loading ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Skeleton className="h-6 w-full" />
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                    Atrybut nie jest jeszcze przypisany do żadnej kategorii.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => <UsageRow key={item.id} item={item} onChanged={usage.retry} />)
                        )}
                    </TableBody>
                </Table>

                <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t pt-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex w-full flex-col gap-1.5 sm:w-64">
                            <Label>Przypisz do kategorii</Label>
                            <Select
                                items={categoryItems}
                                value={categoryId}
                                disabled={isAdding || !categories.data}
                                onValueChange={setCategoryId}
                            >
                                <SelectTrigger className="w-full" aria-invalid={addError ? true : undefined}>
                                    <SelectValue
                                        placeholder={
                                            !categories.data
                                                ? "Ładowanie..."
                                                : available.length === 0
                                                  ? "Wszystkie kategorie przypisane"
                                                  : "Wybierz kategorię"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {categoryItems.map((item) => (
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
