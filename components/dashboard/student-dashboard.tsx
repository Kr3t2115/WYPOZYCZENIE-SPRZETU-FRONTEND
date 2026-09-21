"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, FileClock, History, PackageCheck, Tag } from "lucide-react";

import { useAuth } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { QueryError } from "@/components/query-error";
import { ReservationStatusBadge } from "@/components/reservations/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { getCategories } from "@/lib/api/category";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getRentals } from "@/lib/api/rentals";
import { getReservations } from "@/lib/api/reservations";
import { daysUntil, formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

const TABLE_LIMIT = 5;

const DUE_SOON_DAYS = 2;

const dueStatusConfig = {
    ok: { className: "text-green-600 dark:text-green-500" },
    warning: { className: "text-orange-600 dark:text-orange-500" },
    danger: { className: "text-red-600 dark:text-red-500" },
} as const;

function dueStatus(days: number) {
    if (days < 0) return "danger";
    if (days <= DUE_SOON_DAYS) return "warning";
    return "ok";
}

function dueLabel(days: number) {
    if (days < 0) return `${Math.abs(days)} dni po terminie`;
    if (days === 0) return "dziś";
    if (days === 1) return "jutro";
    return `za ${days} dni`;
}

export default function StudentDashboard() {
    const user = useAuth((state) => state.user);

    // backend zwraca studentowi wyłącznie jego wypożyczenia; jego filtr statusu tu nie działa,
    // więc aktywne wypożyczenia wybieramy po stronie klienta
    const rentals = useAsyncData("dashboard:rentals", () => getRentals("limit=100"));
    // dla rezerwacji filtr statusu działa, więc liczba oczekujących (meta.total) jest dokładna
    const pending = useAsyncData("dashboard:reservations-pending", () => getReservations("status=PENDING&limit=" + TABLE_LIMIT));
    const approved = useAsyncData("dashboard:reservations-approved", () => getReservations("status=APPROVED&limit=" + TABLE_LIMIT));
    const categories = useAsyncData("dashboard:categories", () => getCategories("limit=5"));

    const active = (rentals.data?.data ?? [])
        .filter((rental) => rental.status === "ACTIVE" || rental.status === "OVERDUE")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const shownRentals = active.slice(0, TABLE_LIMIT);
    const reservations = [...(pending.data?.data ?? []), ...(approved.data?.data ?? [])].slice(0, TABLE_LIMIT);

    const equipment = useLookup(
        "equipment",
        [...shownRentals.map((rental) => rental.equipmentId), ...reservations.map((item) => item.equipmentId)],
        getEquipmentById
    );

    const overdue = active.filter((rental) => rental.status === "OVERDUE" || daysUntil(rental.dueDate) < 0);
    const dueSoon = active.filter((rental) => !overdue.includes(rental) && daysUntil(rental.dueDate) <= DUE_SOON_DAYS);

    const equipmentName = (id: string) =>
        equipment.items.get(id)?.name ?? (equipment.loading ? <Skeleton className="h-5 w-32" /> : "Nieznany sprzęt");

    const failed = [rentals, pending, approved].filter((source) => source.error != null);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">Witaj{user?.firstName ? `, ${user.firstName}` : ""}!</h1>
                <p className="text-sm text-muted-foreground">Podsumowanie Twoich wypożyczeń i rezerwacji.</p>
            </div>

            {failed.length > 0 && (
                <QueryError
                    title="Nie udało się pobrać części danych"
                    error={failed[0].error}
                    onRetry={() => failed.forEach((source) => source.retry())}
                />
            )}

            {overdue.length > 0 ? (
                <Alert variant="destructive" className="border-red-500/50 text-red-600 dark:text-red-500 [&>svg]:text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                        {overdue.length === 1 ? "Wypożyczenie po terminie" : `Wypożyczenia po terminie: ${overdue.length}`}
                    </AlertTitle>
                    <AlertDescription>
                        Oddaj sprzęt jak najszybciej lub poproś o przedłużenie terminu.
                    </AlertDescription>
                </Alert>
            ) : dueSoon.length > 0 ? (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Zbliżający się termin zwrotu</AlertTitle>
                    <AlertDescription>
                        {dueSoon.length === 1
                            ? `Masz sprzęt do oddania ${dueLabel(daysUntil(dueSoon[0].dueDate))}.`
                            : `Masz ${dueSoon.length} wypożyczenia do oddania w ciągu ${DUE_SOON_DAYS} dni.`}
                    </AlertDescription>
                </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    title="Aktywnie wypożyczony sprzęt"
                    value={active.length}
                    icon={PackageCheck}
                    loading={rentals.loading && !rentals.stale}
                    href="/my-rentals"
                />
                <StatCard
                    title="Oczekujące rezerwacje"
                    value={pending.data?.meta.total ?? 0}
                    icon={FileClock}
                    loading={pending.loading && !pending.stale}
                    href="/my-reservations?status=PENDING"
                />
                <StatCard
                    title="Historia wszystkich wypożyczeń"
                    value={rentals.data?.meta.total ?? 0}
                    icon={History}
                    loading={rentals.loading && !rentals.stale}
                    href="/my-rentals"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            Aktualnie u Ciebie
                            <Link href="/my-rentals" className="text-sm font-normal text-muted-foreground hover:underline">
                                Wszystkie wypożyczenia
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Przedmiot</TableHead>
                                    <TableHead>Wypożyczono</TableHead>
                                    <TableHead>Zwrot do</TableHead>
                                    <TableHead className="text-right">Akcja</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rentals.loading && !rentals.stale ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={4}>
                                                <Skeleton className="h-6 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : shownRentals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nie masz teraz żadnego wypożyczonego sprzętu.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shownRentals.map((rental) => {
                                        const days = daysUntil(rental.dueDate);
                                        const status = dueStatusConfig[dueStatus(days)];

                                        return (
                                            <TableRow key={rental.id}>
                                                <TableCell>
                                                    <Link href={`/my-rentals/${rental.id}`} className="font-medium hover:underline">
                                                        {equipmentName(rental.equipmentId)}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground">
                                                        {equipment.items.get(rental.equipmentId)?.inventoryNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(rental.startDate)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className={cn("font-medium", status.className)}>
                                                        {formatDate(rental.dueDate)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{dueLabel(days)}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link
                                                        href={`/my-rentals/${rental.id}/extend`}
                                                        className={buttonVariants({ variant: "outline", size: "sm" })}
                                                    >
                                                        Poproś o przedłużenie
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Status złożonych wniosków
                                <Link
                                    href="/my-reservations"
                                    className="text-sm font-normal text-muted-foreground hover:underline"
                                >
                                    Wszystkie
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {(pending.loading && !pending.stale) || (approved.loading && !approved.stale) ? (
                                <Skeleton className="h-16 w-full" />
                            ) : reservations.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Brak oczekujących i zaakceptowanych rezerwacji.</p>
                            ) : (
                                reservations.map((reservation) => (
                                    <Link
                                        key={reservation.id}
                                        href={`/my-reservations/${reservation.id}`}
                                        className="flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium">{equipmentName(reservation.equipmentId)}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(reservation.startDate)} – {formatDate(reservation.endDate)}
                                            </span>
                                        </div>
                                        <ReservationStatusBadge status={reservation.status} />
                                    </Link>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Szybki wybór
                                <Link href="/equipment" className="text-sm font-normal text-muted-foreground hover:underline">
                                    Cały katalog
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-1">
                            {categories.loading && !categories.stale ? (
                                <Skeleton className="h-16 w-full" />
                            ) : (categories.data?.data ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">Brak kategorii sprzętu.</p>
                            ) : (
                                categories.data?.data.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/equipment?categoryId=${category.id}`}
                                        className={buttonVariants({ variant: "ghost" }) + " justify-between"}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Tag className="h-4 w-4" />
                                            {category.name}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
