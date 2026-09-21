"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DetailField } from "@/components/detail-field";
import { InspectionTypeBadge } from "@/components/inspections/type-badge";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { UploadQrPanel } from "@/components/photos/upload-qr-panel";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { ApiError } from "@/lib/api-client";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { getById, regenerateUploadToken, update } from "@/lib/api/rentals-inspections";
import { insert as insertPhotos } from "@/lib/api/rentals-inspections-photos";
import { getById as getUserById } from "@/lib/api/users";
import { formatDateTime } from "@/lib/date";

const NOTES_MIN_LENGTH = 10;
const NOTES_MAX_LENGTH = 1000;

// /desk/inspections/[id] - inspekcje są dostępne wyłącznie dla IT_STAFF / SECRETARIAT
export function InspectionDetails({ id }: { id: string }) {
    const inspection = useAsyncData("inspection:" + id, () => getById(id));

    // po akcji dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = inspection.data ?? (inspection.stale?.id === id ? inspection.stale : undefined);

    const rental = useLookup("rentals", item ? [item.rentalId] : [], getRentalById);
    const rentalItem = item ? rental.items.get(item.rentalId) : undefined;
    const equipment = useLookup("equipment", rentalItem ? [rentalItem.equipmentId] : [], getEquipmentById);
    const users = useLookup("users", item ? [item.inspectedBy] : [], getUserById);

    // null = bez zmian względem tego, co zapisano w rekordzie
    const [notesDraft, setNotesDraft] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const backLink = (
        <Link href="/desk/inspections" className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (inspection.error != null && !item) {
        const notFound = inspection.error instanceof ApiError && inspection.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono inspekcji" : "Nie udało się pobrać inspekcji"}
                    error={inspection.error}
                    onRetry={notFound ? undefined : inspection.retry}
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
    const inspector = users.items.get(item.inspectedBy);
    const notes = notesDraft ?? item.notes ?? "";

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);

        const trimmed = notes.trim();
        if (trimmed.length < NOTES_MIN_LENGTH) {
            return setFormError(`Notatka musi mieć co najmniej ${NOTES_MIN_LENGTH} znaków.`);
        }

        setIsSubmitting(true);

        try {
            await update(id, { notes: trimmed });
            setNotesDraft(null);
            inspection.retry();
        } catch (error) {
            setFormError(getErrorMessage(error, "Nie udało się zapisać notatki."));
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
                            Inspekcja{equipmentItem ? `: ${equipmentItem.name}` : ""}
                        </h1>
                        <InspectionTypeBadge type={item.type} />
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                </div>
            </div>

            {inspection.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={inspection.error} onRetry={inspection.retry} />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Szczegóły inspekcji</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <DetailField label="Typ">
                                    <InspectionTypeBadge type={item.type} />
                                </DetailField>
                                <DetailField label="Wypożyczenie">
                                    <Link
                                        href={`/desk/history/${item.rentalId}`}
                                        className="underline underline-offset-4"
                                    >
                                        Zobacz wypożyczenie
                                    </Link>
                                </DetailField>
                                <DetailField label="Sprzęt">
                                    {equipmentItem?.name ?? (rental.loading || equipment.loading ? "…" : "—")}
                                </DetailField>
                                <DetailField label="Przeprowadził">
                                    {inspector?.email ?? (users.loading ? "…" : "—")}
                                </DetailField>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Notatki</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
                                {formError && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{formError}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="notes">Stan sprzętu</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Opisz stan sprzętu podczas inspekcji..."
                                        value={notes}
                                        maxLength={NOTES_MAX_LENGTH}
                                        onChange={(e) => setNotesDraft(e.target.value)}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-fit"
                                    disabled={isSubmitting || notes === (item.notes ?? "")}
                                >
                                    {isSubmitting ? "Zapisywanie..." : "Zapisz notatkę"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Zdjęcia</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <PhotoGallery photos={item.photos} />

                        <div className="flex flex-col gap-2 border-t pt-4">
                            <h3 className="text-sm font-medium">Dodaj zdjęcia</h3>
                            <PhotoUploader upload={(files) => insertPhotos(id, files)} onUploaded={inspection.retry} />
                        </div>

                        <div className="flex flex-col gap-2 border-t pt-4">
                            <h3 className="text-sm font-medium">Wgraj z telefonu</h3>
                            <UploadQrPanel
                                path={`/rental-inspection/${id}/upload`}
                                token={item.uploadToken}
                                tokenExpiry={item.uploadTokenExpiry}
                                regenerate={() => regenerateUploadToken(id)}
                                onRegenerated={inspection.retry}
                                onPoll={inspection.retry}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
