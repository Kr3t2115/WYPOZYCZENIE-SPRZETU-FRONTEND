"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailField } from "@/components/detail-field";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { RentalStatusBadge } from "@/components/rentals/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { ApiError } from "@/lib/api-client";
import { getById, update } from "@/lib/api/rentals";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getUserById } from "@/lib/api/users";
import { formatDate, formatDateTime } from "@/lib/date";
import { UpdateRental } from "@/lib/validations/rentals";

type PendingAction = "lost" | null;

// "user" - /my-rentals/[id] (student), "desk" - /desk/history/[id] (IT_STAFF / SECRETARIAT)
export function RentalDetails({ id, mode }: { id: string; mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const listHref = desk ? "/desk/history" : "/my-rentals";
    const equipmentBaseHref = desk ? "/desk/inventory" : "/equipment";
    const reservationBaseHref = desk ? "/desk/requests" : "/my-reservations";

    const rental = useAsyncData("rental:" + id, () => getById(id));

    // po akcji dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = rental.data ?? (rental.stale?.id === id ? rental.stale : undefined);

    const equipment = useLookup("equipment", item ? [item.equipmentId] : [], getEquipmentById);

    // e-maile dostępne tylko dla staffu (GET /users)
    const userIds = desk && item ? [item.studentId, item.issuedBy, ...(item.receivedBy ? [item.receivedBy] : [])] : [];
    const users = useLookup("users", userIds, getUserById);

    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    async function runUpdate(data: UpdateRental, fallbackError: string) {
        setIsSubmitting(true);
        setActionError(null);

        try {
            await update(id, data);
            setPendingAction(null);
            rental.retry();
        } catch (error) {
            setActionError(getErrorMessage(error, fallbackError));
        } finally {
            setIsSubmitting(false);
        }
    }

    const backLink = (
        <Link href={listHref} className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (rental.error != null && !item) {
        const notFound = rental.error instanceof ApiError && rental.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono wypożyczenia" : "Nie udało się pobrać wypożyczenia"}
                    error={rental.error}
                    onRetry={notFound ? undefined : rental.retry}
                />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Skeleton className="h-8 w-72" />
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    const equipmentItem = equipment.items.get(item.equipmentId);
    const email = (userId: string | null) => {
        if (!userId) return "—";
        return users.items.get(userId)?.email ?? (users.loading ? "…" : "—");
    };

    // zwrot i zgubienie ma sens tylko dla wypożyczeń, które nadal trwają
    const isOpen = item.status === "ACTIVE" || item.status === "OVERDUE";
    const hasActions = desk && isOpen;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold">
                            Wypożyczenie{equipmentItem ? `: ${equipmentItem.name}` : ""}
                        </h1>
                        <RentalStatusBadge status={item.status} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {formatDate(item.startDate)} – {formatDate(item.dueDate)}
                    </span>
                </div>
            </div>

            {rental.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={rental.error} onRetry={rental.retry} />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Szczegóły wypożyczenia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <DetailField label="Status">
                                <RentalStatusBadge status={item.status} />
                            </DetailField>
                            <DetailField label="Wydano">{formatDate(item.startDate)}</DetailField>
                            <DetailField label="Termin zwrotu">{formatDate(item.dueDate)}</DetailField>
                            <DetailField label="Zwrócono">
                                {item.returnedAt ? formatDate(item.returnedAt) : "—"}
                            </DetailField>
                            <DetailField label="Utworzono">{formatDateTime(item.createdAt)}</DetailField>
                            <DetailField label="Ostatnia zmiana">{formatDateTime(item.updatedAt)}</DetailField>
                            {desk && (
                                <>
                                    <DetailField label="Wydał">{email(item.issuedBy)}</DetailField>
                                    <DetailField label="Przyjął zwrot">{email(item.receivedBy)}</DetailField>
                                </>
                            )}
                            <DetailField label="Rezerwacja">
                                {item.reservationId ? (
                                    <Link
                                        href={`${reservationBaseHref}/${item.reservationId}`}
                                        className="underline underline-offset-4"
                                    >
                                        Zobacz rezerwację
                                    </Link>
                                ) : (
                                    "Wypożyczenie bez rezerwacji"
                                )}
                            </DetailField>
                        </dl>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sprzęt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {equipmentItem ? (
                                <div className="flex flex-col gap-4">
                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        <DetailField label="Nazwa">{equipmentItem.name}</DetailField>
                                        <DetailField label="Nr inwentarzowy">{equipmentItem.inventoryNumber}</DetailField>
                                        <DetailField label="Kategoria">{equipmentItem.category.name}</DetailField>
                                        <DetailField label="Status sprzętu">
                                            <EquipmentStatusBadge status={equipmentItem.status} />
                                        </DetailField>
                                    </dl>
                                    <Link
                                        href={`${equipmentBaseHref}/${equipmentItem.id}`}
                                        className={buttonVariants({ variant: "outline", size: "sm" }) + " w-fit"}
                                    >
                                        Zobacz sprzęt
                                    </Link>
                                </div>
                            ) : equipment.loading ? (
                                <Skeleton className="h-24 w-full" />
                            ) : (
                                <p className="text-sm text-muted-foreground">Nie udało się pobrać danych sprzętu.</p>
                            )}
                        </CardContent>
                    </Card>

                    {desk && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Wypożyczający</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <DetailField label="E-mail">{email(item.studentId)}</DetailField>
                                    <DetailField label="ID studenta">{item.studentId}</DetailField>
                                </dl>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Usterki{desk ? " i inspekcje" : ""}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Link href={`${listHref}/${id}/report-fault`} className={buttonVariants()}>
                        Zgłoś usterkę
                    </Link>
                    <Link
                        href={desk ? "/desk/faults" : "/my-rentals/faults"}
                        className={buttonVariants({ variant: "outline" })}
                    >
                        {desk ? "Wszystkie usterki" : "Moje usterki"}
                    </Link>
                    {desk && (
                        <>
                            <Link
                                href={`/desk/history/${id}/inspection`}
                                className={buttonVariants({ variant: "outline" })}
                            >
                                Dodaj inspekcję
                            </Link>
                            <Link href="/desk/inspections" className={buttonVariants({ variant: "outline" })}>
                                Inspekcje
                            </Link>
                        </>
                    )}
                </CardContent>
            </Card>

            {!desk && isOpen && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Przedłużenie</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Link href={`/my-rentals/${id}/extend`} className={buttonVariants()}>
                            Poproś o przedłużenie
                        </Link>
                        <Link href="/my-rentals/extensions" className={buttonVariants({ variant: "outline" })}>
                            Moje przedłużenia
                        </Link>
                    </CardContent>
                </Card>
            )}

            {hasActions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Akcje</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {actionError && (
                            <Alert variant="destructive">
                                <AlertDescription>{actionError}</AlertDescription>
                            </Alert>
                        )}

                        {pendingAction === "lost" && (
                            <p className="text-sm">Na pewno oznaczyć sprzęt jako zgubiony? Tej operacji nie można cofnąć.</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {pendingAction === null ? (
                                <>
                                    <Button
                                        className="gap-1"
                                        disabled={isSubmitting}
                                        // returnedAt pomijamy: schemat backendu wymaga daty późniejszej niż dziś, więc dzisiejszego zwrotu nie da się wysłać
                                        onClick={() => runUpdate({ status: "RETURNED" }, "Nie udało się przyjąć zwrotu.")}
                                    >
                                        <Check className="h-4 w-4" />
                                        {isSubmitting ? "Zapisywanie..." : "Przyjmij zwrot"}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setActionError(null);
                                            setPendingAction("lost");
                                        }}
                                    >
                                        Oznacz jako zgubiony
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="destructive"
                                        disabled={isSubmitting}
                                        onClick={() => runUpdate({ status: "LOST" }, "Nie udało się zapisać zmiany.")}
                                    >
                                        {isSubmitting ? "Zapisywanie..." : "Tak, oznacz jako zgubiony"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setPendingAction(null);
                                            setActionError(null);
                                        }}
                                    >
                                        Wróć
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
