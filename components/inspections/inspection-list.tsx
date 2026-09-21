"use client"

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InspectionTypeBadge } from "@/components/inspections/type-badge";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { getRentalsInspections } from "@/lib/api/rentals-inspections";
import { formatDate } from "@/lib/date";

const PAGE_SIZE = 10;

// Stała na poziomie modułu (useQueryFilters używa jej w zależnościach). Backend obsługuje tu tylko paginację.
const DEFAULT_FILTERS = { page: 1 };

const placeholder = (loading: boolean) => (loading ? <Skeleton className="h-6 w-32" /> : "—");

// /desk/inspections - inspekcje są dostępne wyłącznie dla IT_STAFF / SECRETARIAT
export function InspectionList() {
    const { filters, setFilter } = useQueryFilters(DEFAULT_FILTERS);

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) }).toString();

    const list = useAsyncData("inspections:" + query, () => getRentalsInspections(query));

    // przy zmianie strony dotychczasowa lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = list.data ?? list.stale;
    const items = response?.data ?? [];
    const meta = response?.meta;

    // inspekcja zna tylko rentalId: wypożyczenie -> sprzęt
    const rentals = useLookup("rentals", items.map((item) => item.rentalId), getRentalById);
    const equipment = useLookup(
        "equipment",
        items.flatMap((item) => {
            const rental = rentals.items.get(item.rentalId);
            return rental ? [rental.equipmentId] : [];
        }),
        getEquipmentById
    );

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">Inspekcje</h1>
                <p className="text-sm text-muted-foreground">
                    Protokoły stanu sprzętu przy wydaniu i zwrocie. Nową inspekcję dodasz w szczegółach wypożyczenia.
                </p>
            </div>

            {list.error != null && (
                <QueryError title="Nie udało się pobrać inspekcji" error={list.error} onRetry={list.retry} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Inspekcje</span>
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
                                <TableHead>Sprzęt</TableHead>
                                <TableHead>Typ</TableHead>
                                <TableHead>Notatki</TableHead>
                                <TableHead>Zdjęcia</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!response && list.loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={6}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {list.error != null ? "Nie udało się wczytać listy." : "Brak inspekcji."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const rental = rentals.items.get(item.rentalId);
                                    const equipmentItem = rental ? equipment.items.get(rental.equipmentId) : undefined;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {equipmentItem?.name ?? placeholder(rentals.loading || equipment.loading)}
                                            </TableCell>
                                            <TableCell>
                                                <InspectionTypeBadge type={item.type} />
                                            </TableCell>
                                            <TableCell
                                                className="max-w-xs truncate text-muted-foreground"
                                                title={item.notes ?? undefined}
                                            >
                                                {item.notes ?? "—"}
                                            </TableCell>
                                            <TableCell>{item.photos.length}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={`/desk/inspections/${item.id}`}
                                                    className={buttonVariants({ variant: "outline", size: "sm" })}
                                                >
                                                    Szczegóły
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {meta && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                                Strona {meta.page} z {Math.max(meta.totalPages, 1)} · {PAGE_SIZE} na stronę
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
