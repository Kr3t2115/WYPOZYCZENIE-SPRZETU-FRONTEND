"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, ClipboardList, PackageCheck, PackageOpen, PackageSearch, Wrench } from "lucide-react";

import { useAuth } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { FaultSeverityBadge } from "@/components/faults/status-badges";
import { QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { getById as getEquipmentById, getEquipments } from "@/lib/api/equipment";
import { getFaults } from "@/lib/api/faults";
import { getRentals } from "@/lib/api/rentals";
import { getRentalsExtensions } from "@/lib/api/rentals-extensions";
import { getReservations } from "@/lib/api/reservations";
import { getById as getUserById } from "@/lib/api/users";
import { daysUntil, formatDate } from "@/lib/date";
import { PaginationResponse } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

const LIST_LIMIT = 5;

// Backend ignoruje filtr statusu dla wypożyczeń, przedłużeń i usterek, więc liczymy je po stronie klienta
// z pierwszej strony (100 rekordów). Gdy jest ich więcej, liczba jest tylko dolną granicą ("12+").
const SCAN_LIMIT = 100;

const DUE_SOON_DAYS = 2;

function countWhere<T>(
    response: { data: T[]; meta: PaginationResponse } | undefined,
    predicate: (item: T) => boolean
) {
    if (!response) return undefined;

    return { count: response.data.filter(predicate).length, approximate: response.meta.totalPages > 1 };
}

function formatCount(result: { count: number; approximate: boolean } | undefined) {
    if (!result) return 0;

    return result.approximate ? `${result.count}+` : result.count;
}

function dueLabel(days: number) {
    if (days < 0) return `${Math.abs(days)} dni po terminie`;
    if (days === 0) return "dziś";
    if (days === 1) return "jutro";
    return `za ${days} dni`;
}

export default function AdminDashboard() {
    const user = useAuth((state) => state.user);

    // filtr statusu działa dla rezerwacji i sprzętu - liczby z meta.total są dokładne
    const pending = useAsyncData("dashboard:reservations-pending", () =>
        getReservations("status=PENDING&limit=" + LIST_LIMIT)
    );
    const approved = useAsyncData("dashboard:reservations-approved", () => getReservations("status=APPROVED&limit=1"));
    const available = useAsyncData("dashboard:equipment-available", () => getEquipments("status=AVAILABLE&limit=1"));
    const rented = useAsyncData("dashboard:equipment-rented", () => getEquipments("status=RENTED&limit=1"));

    const rentals = useAsyncData("dashboard:rentals", () => getRentals("limit=" + SCAN_LIMIT));
    const extensions = useAsyncData("dashboard:extensions", () => getRentalsExtensions("limit=" + SCAN_LIMIT));
    const faults = useAsyncData("dashboard:faults", () => getFaults("limit=" + SCAN_LIMIT));

    const isOpenRental = (status: string) => status === "ACTIVE" || status === "OVERDUE";

    const needAttention = (rentals.data?.data ?? [])
        .filter((rental) => isOpenRental(rental.status) && (rental.status === "OVERDUE" || daysUntil(rental.dueDate) <= DUE_SOON_DAYS))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const overdueCount = countWhere(
        rentals.data,
        (rental) => isOpenRental(rental.status) && (rental.status === "OVERDUE" || daysUntil(rental.dueDate) < 0)
    );
    const pendingExtensions = countWhere(extensions.data, (extension) => extension.status === "PENDING");
    const isOpenFault = (status: string) => status === "OPEN" || status === "IN_REVIEW";
    const openFaults = countWhere(faults.data, (fault) => isOpenFault(fault.status));

    const shownPending = pending.data?.data ?? [];
    const shownRentals = needAttention.slice(0, LIST_LIMIT);
    const shownFaults = (faults.data?.data ?? [])
        .filter((fault) => isOpenFault(fault.status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, LIST_LIMIT);

    const equipment = useLookup(
        "equipment",
        [...shownPending.map((item) => item.equipmentId), ...shownRentals.map((item) => item.equipmentId)],
        getEquipmentById
    );
    const students = useLookup(
        "users",
        [...shownPending.map((item) => item.studentId), ...shownRentals.map((item) => item.studentId)],
        getUserById
    );

    const equipmentName = (id: string) =>
        equipment.items.get(id)?.name ?? (equipment.loading ? <Skeleton className="h-5 w-32" /> : "Nieznany sprzęt");
    const studentEmail = (id: string) =>
        students.items.get(id)?.email ?? (students.loading ? <Skeleton className="h-5 w-32" /> : "—");

    const sources = [pending, approved, available, rented, rentals, extensions, faults];
    const failed = sources.filter((source) => source.error != null);
    const isLoading = (source: { loading: boolean; stale: unknown }) => source.loading && !source.stale;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">Witaj{user?.firstName ? `, ${user.firstName}` : ""}!</h1>
                <p className="text-sm text-muted-foreground">Bieżący stan wypożyczalni i sprawy do załatwienia.</p>
            </div>

            {failed.length > 0 && (
                <QueryError
                    title="Nie udało się pobrać części danych"
                    error={failed[0].error}
                    onRetry={() => failed.forEach((source) => source.retry())}
                />
            )}

            {overdueCount && overdueCount.count > 0 ? (
                <Alert variant="destructive" className="border-red-500/50 text-red-600 dark:text-red-500 [&>svg]:text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Wypożyczenia po terminie: {formatCount(overdueCount)}</AlertTitle>
                    <AlertDescription>
                        Skontaktuj się ze studentami lub sprawdź szczegóły w{" "}
                        <Link href="/desk/history" className="underline">
                            historii wypożyczeń
                        </Link>
                        .
                    </AlertDescription>
                </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Wnioski do rozpatrzenia"
                    value={pending.data?.meta.total ?? 0}
                    icon={ClipboardList}
                    loading={isLoading(pending)}
                    href="/desk/requests?status=PENDING"
                />
                <StatCard
                    title="Zaakceptowane, do wydania"
                    value={approved.data?.meta.total ?? 0}
                    icon={PackageOpen}
                    loading={isLoading(approved)}
                    href="/desk/requests?status=APPROVED"
                />
                <StatCard
                    title="Prośby o przedłużenie"
                    value={formatCount(pendingExtensions)}
                    icon={CalendarClock}
                    loading={isLoading(extensions)}
                    href="/desk/extensions"
                />
                <StatCard
                    title="Sprzęt dostępny"
                    value={available.data?.meta.total ?? 0}
                    icon={PackageSearch}
                    loading={isLoading(available)}
                    href="/desk/inventory?status=AVAILABLE"
                />
                <StatCard
                    title="Sprzęt wypożyczony"
                    value={rented.data?.meta.total ?? 0}
                    icon={PackageCheck}
                    loading={isLoading(rented)}
                    href="/desk/inventory?status=RENTED"
                />
                <StatCard
                    title="Otwarte usterki"
                    value={formatCount(openFaults)}
                    icon={Wrench}
                    loading={isLoading(faults)}
                    href="/desk/faults"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Wnioski do rozpatrzenia
                            <Link
                                href="/desk/requests?status=PENDING"
                                className="text-sm font-normal text-muted-foreground hover:underline"
                            >
                                Wszystkie
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sprzęt</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Termin</TableHead>
                                    <TableHead className="text-right">Akcja</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading(pending) ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={4}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : shownPending.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Brak wniosków oczekujących na rozpatrzenie.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shownPending.map((reservation) => (
                                        <TableRow key={reservation.id}>
                                            <TableCell className="font-medium">
                                                {equipmentName(reservation.equipmentId)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {studentEmail(reservation.studentId)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(reservation.startDate)} – {formatDate(reservation.endDate)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={`/desk/requests/${reservation.id}`}
                                                    className={buttonVariants({ variant: "outline", size: "sm" })}
                                                >
                                                    Rozpatrz
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Terminy zwrotu
                                <Link
                                    href="/desk/history"
                                    className="text-sm font-normal text-muted-foreground hover:underline"
                                >
                                    Historia
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {isLoading(rentals) ? (
                                <Skeleton className="h-16 w-full" />
                            ) : shownRentals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Żadne wypożyczenie nie jest po terminie ani nie kończy się w ciągu {DUE_SOON_DAYS} dni.
                                </p>
                            ) : (
                                shownRentals.map((rental) => {
                                    const days = daysUntil(rental.dueDate);

                                    return (
                                        <Link
                                            key={rental.id}
                                            href={`/desk/history/${rental.id}`}
                                            className="flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex min-w-0 flex-col gap-1">
                                                <span className="truncate text-sm font-medium">
                                                    {equipmentName(rental.equipmentId)}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {studentEmail(rental.studentId)}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end">
                                                <span
                                                    className={cn(
                                                        "text-sm font-medium",
                                                        days < 0
                                                            ? "text-red-600 dark:text-red-500"
                                                            : "text-orange-600 dark:text-orange-500"
                                                    )}
                                                >
                                                    {formatDate(rental.dueDate)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{dueLabel(days)}</span>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Otwarte usterki
                                <Link
                                    href="/desk/faults"
                                    className="text-sm font-normal text-muted-foreground hover:underline"
                                >
                                    Wszystkie
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {isLoading(faults) ? (
                                <Skeleton className="h-16 w-full" />
                            ) : shownFaults.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Brak otwartych usterek.</p>
                            ) : (
                                shownFaults.map((fault) => (
                                    <Link
                                        key={fault.id}
                                        href={`/desk/faults/${fault.id}`}
                                        className="flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <span className="truncate text-sm font-medium">{fault.description}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(fault.createdAt)}
                                            </span>
                                        </div>
                                        <FaultSeverityBadge severity={fault.severity} />
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
