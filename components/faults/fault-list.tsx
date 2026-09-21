"use client"

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaultSeverityBadge, FaultStatusBadge } from "@/components/faults/status-badges";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getFaults } from "@/lib/api/faults";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { getById as getUserById } from "@/lib/api/users";
import { formatDate } from "@/lib/date";

const PAGE_SIZE = 10;

// Stała na poziomie modułu (useQueryFilters używa jej w zależnościach). Backend obsługuje tu tylko paginację.
const DEFAULT_FILTERS = { page: 1 };

const placeholder = (loading: boolean) => (loading ? <Skeleton className="h-6 w-32" /> : "—");

// "user" - /my-rentals/faults (student, widzi tylko swoje), "desk" - /desk/faults (IT_STAFF / SECRETARIAT)
export function FaultList({ mode }: { mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const baseHref = desk ? "/desk/faults" : "/my-rentals/faults";
    const columnCount = desk ? 7 : 6;

    const { filters, setFilter } = useQueryFilters(DEFAULT_FILTERS);

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) }).toString();

    const list = useAsyncData("faults:" + query, () => getFaults(query));

    // przy zmianie strony dotychczasowa lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = list.data ?? list.stale;
    const items = response?.data ?? [];
    const meta = response?.meta;

    // usterka zna tylko rentalId: wypożyczenie -> sprzęt; dla staffu dodatkowo e-mail zgłaszającego
    const rentals = useLookup("rentals", items.map((item) => item.rentalId), getRentalById);
    const equipment = useLookup(
        "equipment",
        items.flatMap((item) => {
            const rental = rentals.items.get(item.rentalId);
            return rental ? [rental.equipmentId] : [];
        }),
        getEquipmentById
    );
    const reporters = useLookup("users", desk ? items.map((item) => item.reportedBy) : [], getUserById);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{desk ? "Usterki" : "Moje usterki"}</h1>
                <p className="text-sm text-muted-foreground">
                    {desk
                        ? "Zgłoszenia uszkodzeń sprzętu - rozpatruj je i zmieniaj status."
                        : "Uszkodzenia, które zgłosiłeś. Nowe zgłosisz w szczegółach wypożyczenia."}
                </p>
            </div>

            {list.error != null && (
                <QueryError title="Nie udało się pobrać usterek" error={list.error} onRetry={list.retry} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Usterki</span>
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
                                {desk && <TableHead>Zgłosił</TableHead>}
                                <TableHead>Opis</TableHead>
                                <TableHead>Powaga</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Zgłoszono</TableHead>
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
                                        {list.error != null
                                            ? "Nie udało się wczytać listy."
                                            : desk
                                              ? "Brak zgłoszonych usterek."
                                              : "Nie zgłosiłeś żadnych usterek."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const rental = rentals.items.get(item.rentalId);
                                    const equipmentItem = rental ? equipment.items.get(rental.equipmentId) : undefined;
                                    const reporter = reporters.items.get(item.reportedBy);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {equipmentItem?.name ?? placeholder(rentals.loading || equipment.loading)}
                                            </TableCell>
                                            {desk && (
                                                <TableCell className="text-muted-foreground">
                                                    {reporter?.email ?? placeholder(reporters.loading)}
                                                </TableCell>
                                            )}
                                            <TableCell className="max-w-xs truncate text-muted-foreground" title={item.description}>
                                                {item.description}
                                            </TableCell>
                                            <TableCell>
                                                <FaultSeverityBadge severity={item.severity} />
                                            </TableCell>
                                            <TableCell>
                                                <FaultStatusBadge status={item.status} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(item.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={`${baseHref}/${item.id}`}
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
