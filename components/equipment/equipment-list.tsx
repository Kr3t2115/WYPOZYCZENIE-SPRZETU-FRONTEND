"use client"

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getEquipments } from "@/lib/api/equipment";
import { getCategories } from "@/lib/api/category";
import { buildEquipmentQuery, DEFAULT_EQUIPMENT_FILTERS, PAGE_SIZE } from "@/lib/equipment-filters";

// "user" - /equipment (student), "desk" - /desk/inventory (IT_STAFF / SECRETARIAT)
export function EquipmentList({ mode }: { mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const baseHref = desk ? "/desk/inventory" : "/equipment";
    const columnCount = desk ? 6 : 4;

    const { filters, setFilter, resetFilters } = useQueryFilters(DEFAULT_EQUIPMENT_FILTERS);

    const query = buildEquipmentQuery(filters, { desk });

    const categories = useAsyncData("categories", () => getCategories("limit=1000"));
    const list = useAsyncData("equipment:" + query, () => getEquipments(query));

    // przy zmianie strony/filtra dotychczasowa lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = list.data ?? list.stale;
    const items = response?.data ?? [];
    const meta = response?.meta;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">{desk ? "Inwentarz i sprzęt" : "Lista sprzętów"}</h1>
                    <p className="text-sm text-muted-foreground">
                        {desk ? "Zarządzaj sprzętem dostępnym w magazynie." : "Przeglądaj dostępny sprzęt do wypożyczenia."}
                    </p>
                </div>
                {desk && (
                    <Link href="/admin/equipment/new" className={buttonVariants() + " gap-1"}>
                        <Plus className="h-4 w-4" />
                        Dodaj sprzęt
                    </Link>
                )}
            </div>

            <EquipmentFilters
                filters={filters}
                setFilter={setFilter}
                resetFilters={resetFilters}
                categories={categories.data?.data ?? categories.stale?.data}
                desk={desk}
            />

            {list.error != null && <QueryError title="Nie udało się pobrać sprzętu" error={list.error} onRetry={list.retry} />}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Sprzęt</span>
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
                                <TableHead>Nr inwentarzowy</TableHead>
                                {desk && <TableHead>Nr seryjny</TableHead>}
                                <TableHead>Kategoria</TableHead>
                                {desk && <TableHead>Status</TableHead>}
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!response && list.loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={columnCount}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                        {list.error != null ? "Nie udało się wczytać listy." : "Brak wyników spełniających kryteria."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.inventoryNumber}</TableCell>
                                        {desk && (
                                            <TableCell className="text-muted-foreground">{item.serialNumber ?? "—"}</TableCell>
                                        )}
                                        <TableCell>{item.category.name}</TableCell>
                                        {desk && (
                                            <TableCell>
                                                <EquipmentStatusBadge status={item.status} />
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right">
                                            <Link
                                                href={`${baseHref}/${item.id}`}
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
