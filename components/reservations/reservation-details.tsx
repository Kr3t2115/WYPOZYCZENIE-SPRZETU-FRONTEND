"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, PackageCheck, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DetailField } from "@/components/detail-field";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { ReservationStatusBadge } from "@/components/reservations/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { ApiError } from "@/lib/api-client";
import { getById, update } from "@/lib/api/reservations";
import { insert as insertRental } from "@/lib/api/rentals";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getUserById } from "@/lib/api/users";
import { formatDate, formatDateTime } from "@/lib/date";
import { UpdateReservation } from "@/lib/validations/reservations";

type PendingAction = "reject" | "cancel" | null;

const REJECT_REASON_MAX_LENGTH = 1000;

// "user" - /my-reservations/[id] (student), "desk" - /desk/requests/[id] (IT_STAFF / SECRETARIAT)
export function ReservationDetails({ id, mode }: { id: string; mode: "user" | "desk" }) {
    const router = useRouter();
    const desk = mode === "desk";
    const listHref = desk ? "/desk/requests" : "/my-reservations";
    const equipmentBaseHref = desk ? "/desk/inventory" : "/equipment";

    const reservation = useAsyncData("reservation:" + id, () => getById(id));

    // po akcji dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = reservation.data ?? (reservation.stale?.id === id ? reservation.stale : undefined);

    const equipment = useLookup("equipment", item ? [item.equipmentId] : [], getEquipmentById);
    const users = useLookup(
        "users",
        desk && item ? [item.studentId, ...(item.reviewedBy ? [item.reviewedBy] : [])] : [],
        getUserById
    );

    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    async function runUpdate(data: UpdateReservation, fallbackError: string) {
        setIsSubmitting(true);
        setActionError(null);

        try {
            await update(id, data);
            setPendingAction(null);
            setRejectReason("");
            reservation.retry();
        } catch (error) {
            setActionError(getErrorMessage(error, fallbackError));
        } finally {
            setIsSubmitting(false);
        }
    }

    // wydanie sprzętu = utworzenie wypożyczenia z zaakceptowanej rezerwacji
    async function handOut() {
        setIsSubmitting(true);
        setActionError(null);

        try {
            const rental = await insertRental({ mode: "FROM_RESERVATION", reservationId: id });
            router.push(`/desk/history/${rental.id}`);
        } catch (error) {
            setActionError(getErrorMessage(error, "Nie udało się wydać sprzętu."));
            setIsSubmitting(false);
        }
    }

    const backLink = (
        <Link href={listHref} className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (reservation.error != null && !item) {
        const notFound = reservation.error instanceof ApiError && reservation.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono rezerwacji" : "Nie udało się pobrać rezerwacji"}
                    error={reservation.error}
                    onRetry={notFound ? undefined : reservation.retry}
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
    const student = users.items.get(item.studentId);
    const reviewer = item.reviewedBy ? users.items.get(item.reviewedBy) : undefined;

    // student może zrezygnować z oczekującej i zaakceptowanej, staff zaakceptować oczekującą
    // oraz odrzucić oczekującą lub wcześniej zaakceptowaną
    const canApprove = desk && item.status === "PENDING";
    const canReject = desk && (item.status === "PENDING" || item.status === "APPROVED");
    const canCancel = !desk && (item.status === "PENDING" || item.status === "APPROVED");
    // backend pozwala wydać sprzęt dopiero od dnia rozpoczęcia rezerwacji
    const canHandOut = desk && item.status === "APPROVED";
    const startsInFuture = new Date(item.startDate) > new Date();
    const hasActions = canApprove || canReject || canCancel || canHandOut;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold">
                            Rezerwacja{equipmentItem ? `: ${equipmentItem.name}` : ""}
                        </h1>
                        <ReservationStatusBadge status={item.status} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </span>
                </div>
            </div>

            {reservation.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={reservation.error} onRetry={reservation.retry} />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Szczegóły rezerwacji</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <DetailField label="Status">
                                <ReservationStatusBadge status={item.status} />
                            </DetailField>
                            <DetailField label="Termin">
                                {formatDate(item.startDate)} – {formatDate(item.endDate)}
                            </DetailField>
                            <DetailField label="Złożono">{formatDateTime(item.createdAt)}</DetailField>
                            <DetailField label="Ostatnia zmiana">{formatDateTime(item.updatedAt)}</DetailField>
                            {item.reviewedAt && (
                                <DetailField label="Rozpatrzono">{formatDateTime(item.reviewedAt)}</DetailField>
                            )}
                            {desk && item.reviewedBy && (
                                <DetailField label="Rozpatrzył">
                                    {reviewer?.email ?? (users.loading ? "…" : "—")}
                                </DetailField>
                            )}
                        </dl>

                        {item.notes && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground">Uwagi studenta</span>
                                <p className="whitespace-pre-wrap text-sm">{item.notes}</p>
                            </div>
                        )}

                        {item.rejectReason && (
                            <Alert variant="destructive">
                                <AlertTitle>Powód odrzucenia</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap">{item.rejectReason}</AlertDescription>
                            </Alert>
                        )}
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
                                <CardTitle className="text-base">Wnioskodawca</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <DetailField label="E-mail">
                                        {student?.email ?? (users.loading ? "…" : "—")}
                                    </DetailField>
                                    <DetailField label="ID studenta">{item.studentId}</DetailField>
                                </dl>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

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

                        {pendingAction === "reject" && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="reject-reason">Powód odrzucenia</Label>
                                <Textarea
                                    id="reject-reason"
                                    placeholder="Podaj studentowi powód odrzucenia..."
                                    value={rejectReason}
                                    maxLength={REJECT_REASON_MAX_LENGTH}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </div>
                        )}

                        {canHandOut && startsInFuture && pendingAction === null && (
                            <p className="text-sm text-muted-foreground">
                                Sprzęt można wydać dopiero od {formatDate(item.startDate)}.
                            </p>
                        )}

                        {pendingAction === "cancel" && (
                            <p className="text-sm">Na pewno chcesz anulować tę rezerwację? Tej operacji nie można cofnąć.</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {pendingAction === null ? (
                                <>
                                    {canHandOut && (
                                        <Button className="gap-1" disabled={isSubmitting || startsInFuture} onClick={handOut}>
                                            <PackageCheck className="h-4 w-4" />
                                            {isSubmitting ? "Wydawanie..." : "Wydaj sprzęt"}
                                        </Button>
                                    )}
                                    {canApprove && (
                                        <Button
                                            className="gap-1"
                                            disabled={isSubmitting}
                                            onClick={() =>
                                                runUpdate({ status: "APPROVED" }, "Nie udało się zaakceptować rezerwacji.")
                                            }
                                        >
                                            <Check className="h-4 w-4" />
                                            {isSubmitting ? "Zapisywanie..." : "Zaakceptuj"}
                                        </Button>
                                    )}
                                    {canReject && (
                                        <Button
                                            variant="destructive"
                                            className="gap-1"
                                            disabled={isSubmitting}
                                            onClick={() => {
                                                setActionError(null);
                                                setPendingAction("reject");
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                            Odrzuć
                                        </Button>
                                    )}
                                    {canCancel && (
                                        <Button
                                            variant="destructive"
                                            disabled={isSubmitting}
                                            onClick={() => {
                                                setActionError(null);
                                                setPendingAction("cancel");
                                            }}
                                        >
                                            Anuluj rezerwację
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="destructive"
                                        disabled={isSubmitting || (pendingAction === "reject" && rejectReason.trim() === "")}
                                        onClick={() =>
                                            pendingAction === "reject"
                                                ? runUpdate(
                                                      { status: "REJECTED", rejectReason: rejectReason.trim() },
                                                      "Nie udało się odrzucić rezerwacji."
                                                  )
                                                : runUpdate(
                                                      // backend przy każdej zmianie studenta nadpisuje notes wartością null,
                                                      // więc istniejące uwagi wysyłamy razem z anulowaniem
                                                      { status: "CANCELLED", ...(item.notes ? { notes: item.notes } : {}) },
                                                      "Nie udało się anulować rezerwacji."
                                                  )
                                        }
                                    >
                                        {isSubmitting
                                            ? "Zapisywanie..."
                                            : pendingAction === "reject"
                                              ? "Potwierdź odrzucenie"
                                              : "Tak, anuluj"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setPendingAction(null);
                                            setRejectReason("");
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
