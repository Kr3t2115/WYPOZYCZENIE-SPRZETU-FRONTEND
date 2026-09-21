"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DetailField } from "@/components/detail-field";
import {
    FAULT_STATUS_CONFIG,
    FaultSeverityBadge,
    FaultStatusBadge,
    OCCURRENCE_LABELS,
} from "@/components/faults/status-badges";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { UploadQrPanel } from "@/components/photos/upload-qr-panel";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { ApiError } from "@/lib/api-client";
import { getById, regenerateUploadToken, update } from "@/lib/api/faults";
import { insert as insertPhotos } from "@/lib/api/faults-photos";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { getById as getUserById } from "@/lib/api/users";
import { formatDate, formatDateTime } from "@/lib/date";
import { FAULT_STATUSES, FaultStatus, UpdateFault } from "@/lib/validations/faults";

const NOTE_MIN_LENGTH = 10;
const NOTE_MAX_LENGTH = 1000;

const statusItems = FAULT_STATUSES.map((status) => ({ value: status, label: FAULT_STATUS_CONFIG[status].label }));

// "user" - /my-rentals/faults/[id] (student), "desk" - /desk/faults/[id] (IT_STAFF / SECRETARIAT)
export function FaultDetails({ id, mode }: { id: string; mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const listHref = desk ? "/desk/faults" : "/my-rentals/faults";
    const rentalBaseHref = desk ? "/desk/history" : "/my-rentals";

    const fault = useAsyncData("fault:" + id, () => getById(id));

    // po akcji dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = fault.data ?? (fault.stale?.id === id ? fault.stale : undefined);

    const rental = useLookup("rentals", item ? [item.rentalId] : [], getRentalById);
    const rentalItem = item ? rental.items.get(item.rentalId) : undefined;
    const equipment = useLookup("equipment", rentalItem ? [rentalItem.equipmentId] : [], getEquipmentById);
    const users = useLookup(
        "users",
        desk && item ? [item.reportedBy, ...(item.resolvedBy ? [item.resolvedBy] : [])] : [],
        getUserById
    );

    // pola formularza rozpatrzenia: null = bez zmian względem tego, co zapisano w rekordzie
    const [statusDraft, setStatusDraft] = useState<FaultStatus | null>(null);
    const [noteDraft, setNoteDraft] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const backLink = (
        <Link href={listHref} className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (fault.error != null && !item) {
        const notFound = fault.error instanceof ApiError && fault.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono usterki" : "Nie udało się pobrać usterki"}
                    error={fault.error}
                    onRetry={notFound ? undefined : fault.retry}
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

    const equipmentItem = rentalItem ? equipment.items.get(rentalItem.equipmentId) : undefined;
    const email = (userId: string | null) => {
        if (!userId) return "—";
        return users.items.get(userId)?.email ?? (users.loading ? "…" : "—");
    };

    const status = statusDraft ?? item.status;
    const note = noteDraft ?? item.resolveNote ?? "";

    async function handleResolve(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);

        const trimmed = note.trim();
        const needsNote = status === "RESOLVED" || status === "DISMISSED";

        if (needsNote && trimmed === "") {
            return setFormError("Dodaj notatkę - opisz, co zostało zrobione lub dlaczego zgłoszenie odrzucono.");
        }
        if (trimmed !== "" && trimmed.length < NOTE_MIN_LENGTH) {
            return setFormError(`Notatka musi mieć co najmniej ${NOTE_MIN_LENGTH} znaków.`);
        }

        const data: UpdateFault = { status, ...(trimmed !== "" ? { resolveNote: trimmed } : {}) };

        setIsSubmitting(true);

        try {
            await update(id, data);
            setStatusDraft(null);
            setNoteDraft(null);
            fault.retry();
        } catch (error) {
            setFormError(getErrorMessage(error, "Nie udało się zapisać zmian."));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold">
                            Usterka{equipmentItem ? `: ${equipmentItem.name}` : ""}
                        </h1>
                        <FaultSeverityBadge severity={item.severity} />
                        <FaultStatusBadge status={item.status} />
                    </div>
                    <span className="text-sm text-muted-foreground">Zgłoszono {formatDateTime(item.createdAt)}</span>
                </div>
            </div>

            {fault.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={fault.error} onRetry={fault.retry} />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Szczegóły usterki</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <DetailField label="Powaga">
                                <FaultSeverityBadge severity={item.severity} />
                            </DetailField>
                            <DetailField label="Status">
                                <FaultStatusBadge status={item.status} />
                            </DetailField>
                            <DetailField label="Kiedy wystąpiła">{OCCURRENCE_LABELS[item.occurredDuring]}</DetailField>
                            <DetailField label="Wypożyczenie">
                                <Link
                                    href={`${rentalBaseHref}/${item.rentalId}`}
                                    className="underline underline-offset-4"
                                >
                                    Zobacz wypożyczenie
                                </Link>
                            </DetailField>
                            {desk && <DetailField label="Zgłosił">{email(item.reportedBy)}</DetailField>}
                            {item.resolvedAt && (
                                <DetailField label="Rozpatrzono">{formatDate(item.resolvedAt)}</DetailField>
                            )}
                            {desk && item.resolvedBy && (
                                <DetailField label="Rozpatrzył">{email(item.resolvedBy)}</DetailField>
                            )}
                        </dl>

                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Opis</span>
                            <p className="whitespace-pre-wrap text-sm">{item.description}</p>
                        </div>

                        {item.resolveNote && (
                            <Alert>
                                <AlertTitle>Notatka z rozpatrzenia</AlertTitle>
                                <AlertDescription className="whitespace-pre-wrap">{item.resolveNote}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Zdjęcia</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <PhotoGallery photos={item.photos} />

                        {/* backend (fault-photo.controller) dopuszcza bezpośredni upload tylko studentowi;
                            staff wgrywa zdjęcia linkiem z tokenem (niżej) */}
                        {!desk && (
                            <div className="flex flex-col gap-2 border-t pt-4">
                                <h3 className="text-sm font-medium">Dodaj zdjęcia</h3>
                                <PhotoUploader upload={(files) => insertPhotos(id, files)} onUploaded={fault.retry} />
                            </div>
                        )}

                        <div className="flex flex-col gap-2 border-t pt-4">
                            <h3 className="text-sm font-medium">Wgraj z telefonu</h3>
                            <UploadQrPanel
                                path={`/faults/${id}/upload`}
                                token={item.uploadToken}
                                tokenExpiry={item.uploadTokenExpiry}
                                regenerate={() => regenerateUploadToken(id)}
                                onRegenerated={fault.retry}
                                onPoll={fault.retry}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {desk && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Rozpatrzenie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleResolve} className="flex max-w-xl flex-col gap-4" noValidate>
                            {formError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{formError}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <Label>Status</Label>
                                <Select
                                    items={statusItems}
                                    value={status}
                                    onValueChange={(value) => value && setStatusDraft(value as FaultStatus)}
                                >
                                    <SelectTrigger className="w-full sm:w-64">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent alignItemWithTrigger={false}>
                                        {statusItems.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="resolve-note">Notatka</Label>
                                <Textarea
                                    id="resolve-note"
                                    placeholder="Co zostało zrobione? (wymagane przy rozwiązaniu lub odrzuceniu)"
                                    value={note}
                                    maxLength={NOTE_MAX_LENGTH}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-fit"
                                disabled={isSubmitting || (status === item.status && note === (item.resolveNote ?? ""))}
                            >
                                {isSubmitting ? "Zapisywanie..." : "Zapisz"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
