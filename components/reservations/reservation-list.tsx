"use client"

import Link from "next/link";
import { Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QueryError } from "@/components/query-error";
import { RESERVATION_STATUS_CONFIG, ReservationStatusBadge } from "@/components/reservations/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getReservations } from "@/lib/api/reservations";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getUserById } from "@/lib/api/users";
import { formatDate } from "@/lib/date";
import {
    buildReservationQuery,
    DEFAULT_RESERVATION_FILTERS,
    isEquipmentIdFilter,
    isReservationStatus,
    RESERVATIONS_PAGE_SIZE,
} from "@/lib/reservation-filters";
import { RESERVATION_STATUSES } from "@/lib/validations/reservations";

const ALL = "all";

const statusItems = [
    { value: ALL, label: "Wszystkie statusy" },
    ...RESERVATION_STATUSES.map((status) => ({ value: status, label: RESERVATION_STATUS_CONFIG[status].label })),
];

// "user" - /my-reservations (student), "desk" - /desk/requests (IT_STAFF / SECRETARIAT)
export function ReservationList({ mode }: { mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const baseHref = desk ? "/desk/requests" : "/my-reservations";
    const columnCount = desk ? 6 : 5;

    const { filters, setFilter, resetFilters } = useQueryFilters(DEFAULT_RESERVATION_FILTERS);

    const query = buildReservationQuery(filters);
    const list = useAsyncData("reservations:" + query, () => getReservations(query));

    // przy zmianie strony/filtra dotychczasowa lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = list.data ?? list.stale;
    const items = response?.data ?? [];
    const meta = response?.meta;

    // backend zwraca same id - nazwy sprzętu (i e-maile studentów dla staffu) dociągamy osobno
    const equipmentFilterId = isEquipmentIdFilter(filters.equipmentId) ? filters.equipmentId : null;
    const equipment = useLookup(
        "equipment",
        [...items.map((item) => item.equipmentId), ...(equipmentFilterId ? [equipmentFilterId] : [])],
        getEquipmentById
    );
    const students = useLookup("users", desk ? items.map((item) => item.studentId) : [], getUserById);

    const hasActiveFilters = isReservationStatus(filters.status) || equipmentFilterId !== null;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold">{desk ? "Wnioski i rezerwacje" : "Moje rezerwacje"}</h1>
                    <p className="text-sm text-muted-foreground">
                        {desk
                            ? "Przeglądaj wnioski studentów, akceptuj je lub odrzucaj."
                            : "Śledź status swoich rezerwacji i anuluj te, których już nie potrzebujesz."}
                    </p>
                </div>
                {!desk && (
                    <Link href="/equipment" className={buttonVariants()}>
                        Zarezerwuj sprzęt
                    </Link>
                )}
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
                <CardContent className="flex flex-wrap items-end gap-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label>Status</Label>
                        <Select
                            items={statusItems}
                            value={isReservationStatus(filters.status) ? filters.status : ALL}
                            onValueChange={(value) => setFilter("status", !value || value === ALL ? "" : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                {statusItems.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {equipmentFilterId && (
                        <Badge variant="secondary" className="h-8 gap-1.5 px-3 text-sm">
                            Sprzęt: {equipment.items.get(equipmentFilterId)?.name ?? "…"}
                            <button
                                type="button"
                                aria-label="Usuń filtr sprzętu"
                                onClick={() => setFilter("equipmentId", "")}
                                className="rounded-full hover:text-destructive"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </Badge>
                    )}
                </CardContent>
            </Card>

            {list.error != null && (
                <QueryError title="Nie udało się pobrać rezerwacji" error={list.error} onRetry={list.retry} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Rezerwacje</span>
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
                                {desk && <TableHead>Student</TableHead>}
                                <TableHead>Termin</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Złożono</TableHead>
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
                                            : hasActiveFilters
                                              ? "Brak wyników spełniających kryteria."
                                              : desk
                                                ? "Brak rezerwacji."
                                                : "Nie masz jeszcze żadnych rezerwacji."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const equipmentItem = equipment.items.get(item.equipmentId);
                                    const student = students.items.get(item.studentId);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {equipmentItem ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{equipmentItem.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {equipmentItem.inventoryNumber}
                                                        </span>
                                                    </div>
                                                ) : equipment.loading ? (
                                                    <Skeleton className="h-6 w-40" />
                                                ) : (
                                                    <span className="text-muted-foreground">Nieznany sprzęt</span>
                                                )}
                                            </TableCell>
                                            {desk && (
                                                <TableCell className="text-muted-foreground">
                                                    {student ? (
                                                        student.email
                                                    ) : students.loading ? (
                                                        <Skeleton className="h-6 w-40" />
                                                    ) : (
                                                        "—"
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(item.startDate)} – {formatDate(item.endDate)}
                                            </TableCell>
                                            <TableCell>
                                                <ReservationStatusBadge status={item.status} />
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
                                Strona {meta.page} z {Math.max(meta.totalPages, 1)} · {RESERVATIONS_PAGE_SIZE} na stronę
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
