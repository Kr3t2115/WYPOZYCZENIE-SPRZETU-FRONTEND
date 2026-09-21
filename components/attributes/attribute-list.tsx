"use client"

import Link from "next/link";
import { Filter, Plus, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttributeTypeBadge, ATTRIBUTE_TYPE_LABELS } from "@/components/attributes/type-badge";
import { DebouncedInput } from "@/components/debounced-input";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getAttributes } from "@/lib/api/attributes";
import {
    ATTRIBUTES_PAGE_SIZE,
    buildAttributeQuery,
    DEFAULT_ATTRIBUTE_FILTERS,
    isAttributeType,
} from "@/lib/attribute-filters";
import { isShortText, MIN_TEXT_LENGTH } from "@/lib/equipment-filters";
import { ATTRIBUTE_TYPES } from "@/lib/validations/attributes";

const ALL = "all";

const typeItems = [
    { value: ALL, label: "Wszystkie typy" },
    ...ATTRIBUTE_TYPES.map((type) => ({ value: type, label: ATTRIBUTE_TYPE_LABELS[type] })),
];

// /admin/attributes - słownik atrybutów sprzętu (IT_STAFF / SECRETARIAT)
export function AttributeList() {
    const { filters, setFilter, resetFilters } = useQueryFilters(DEFAULT_ATTRIBUTE_FILTERS);

    const query = buildAttributeQuery(filters);
    const list = useAsyncData("attributes:" + query, () => getAttributes(query));

    // przy zmianie strony/filtra dotychczasowa lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = list.data ?? list.stale;
    const items = response?.data ?? [];
    const meta = response?.meta;

    const hasActiveFilters = filters.name !== "" || isAttributeType(filters.type);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">Atrybuty</h1>
                    <p className="text-sm text-muted-foreground">
                        Cechy, którymi opisujesz sprzęt (np. RAM, procesor). Przypisujesz je do kategorii, a wartości
                        wpisujesz przy sprzęcie.
                    </p>
                </div>
                <Link href="/admin/attributes/new" className={buttonVariants() + " gap-1"}>
                    <Plus className="h-4 w-4" />
                    Nowy atrybut
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                        <span className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filtry
                        </span>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                                <X className="h-4 w-4" />
                                Wyczyść
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="filter-name">Nazwa</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <DebouncedInput
                                    id="filter-name"
                                    placeholder="Szukaj po nazwie..."
                                    value={filters.name}
                                    onCommit={(value) => setFilter("name", value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Typ</Label>
                            <Select
                                items={typeItems}
                                value={isAttributeType(filters.type) ? filters.type : ALL}
                                onValueChange={(value) => setFilter("type", !value || value === ALL ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Typ" />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {typeItems.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isShortText(filters.name) && (
                        <p className="text-xs text-muted-foreground">Filtr tekstowy działa od {MIN_TEXT_LENGTH} znaków.</p>
                    )}
                </CardContent>
            </Card>

            {list.error != null && (
                <QueryError title="Nie udało się pobrać atrybutów" error={list.error} onRetry={list.retry} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Lista atrybutów</span>
                        {meta && (
                            <span className="text-sm font-normal text-muted-foreground">
                                {meta.total} {meta.total === 1 ? "wynik" : "wyników"}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Table className={list.loading && response ? "opacity-60 transition-opacity" : undefined}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Typ</TableHead>
                                <TableHead>Jednostka</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!response && list.loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={4}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {list.error != null
                                            ? "Nie udało się wczytać listy."
                                            : hasActiveFilters
                                              ? "Brak wyników spełniających kryteria."
                                              : "Nie ma jeszcze żadnych atrybutów."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <AttributeTypeBadge type={item.type} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{item.unit ?? "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/attributes/${item.id}`}
                                                className={buttonVariants({ variant: "outline", size: "sm" })}
                                            >
                                                Szczegóły
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {meta && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                                Strona {meta.page} z {Math.max(meta.totalPages, 1)} · {ATTRIBUTES_PAGE_SIZE} na stronę
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!meta.hasPrevPage || list.loading}
                                    onClick={() => setFilter("page", meta.page - 1)}
                                >
                                    Poprzednia
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!meta.hasNextPage || list.loading}
                                    onClick={() => setFilter("page", meta.page + 1)}
                                >
                                    Następna
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
