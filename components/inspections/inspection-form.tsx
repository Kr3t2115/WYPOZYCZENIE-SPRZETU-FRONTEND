"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { INSPECTION_TYPE_CONFIG } from "@/components/inspections/type-badge";
import { PhotoPicker } from "@/components/photos/photo-uploader";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { RentalStatusBadge } from "@/components/rentals/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { insert } from "@/lib/api/rentals-inspections";
import { insert as insertPhotos } from "@/lib/api/rentals-inspections-photos";
import { formatDate } from "@/lib/date";
import { createSchema, INSPECTION_TYPES, InspectionType } from "@/lib/validations/rentals-inspections";

type Field = "type" | "notes";

const NOTES_MAX_LENGTH = 1000;

const typeItems = INSPECTION_TYPES.map((value) => ({ value, label: INSPECTION_TYPE_CONFIG[value].label }));

// /desk/history/[id]/inspection - dodanie inspekcji do wypożyczenia (IT_STAFF / SECRETARIAT).
// Backend pozwala na jedną inspekcję danego typu (wydanie / zwrot) na wypożyczenie.
export function InspectionForm({ rentalId }: { rentalId: string }) {
    const router = useRouter();
    const rentalHref = `/desk/history/${rentalId}`;

    const rental = useAsyncData("rental:" + rentalId, () => getRentalById(rentalId));
    const equipment = useLookup("equipment", rental.data ? [rental.data.equipmentId] : [], getEquipmentById);

    const [type, setType] = useState<InspectionType | null>(null);
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [progress, setProgress] = useState<string | null>(null);
    // inspekcja już istnieje, ale zdjęcia się nie wgrały - nie można wysłać formularza drugi raz (błąd unikalności)
    const [created, setCreated] = useState<{ id: string; photoError: string } | null>(null);

    const backLink = (
        <Link href={rentalHref} className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}>
            <ArrowLeft className="h-4 w-4" />
            Wróć do wypożyczenia
        </Link>
    );

    if (rental.error != null) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError title="Nie udało się pobrać wypożyczenia" error={rental.error} onRetry={rental.retry} />
            </div>
        );
    }

    if (!rental.data) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-80 max-w-xl" />
            </div>
        );
    }

    const equipmentItem = equipment.items.get(rental.data.equipmentId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = createSchema.safeParse({
            rentalId,
            type: type ?? undefined,
            notes: notes.trim() || undefined,
        });

        if (!result.success) {
            const nextErrors: Partial<Record<Field, string>> = {};

            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === "type" || field === "notes") {
                    nextErrors[field] ??=
                        field === "type" ? "Wybierz typ inspekcji" : "Notatka musi mieć od 10 do 1000 znaków";
                }
            }

            return setErrors(nextErrors);
        }

        setErrors({});
        setIsSubmitting(true);

        let inspectionId: string;

        try {
            const inspection = await insert(result.data);
            inspectionId = inspection.id;
        } catch (error) {
            setServerError(getErrorMessage(error, "Nie udało się dodać inspekcji. Spróbuj ponownie."));
            setIsSubmitting(false);
            return;
        }

        // zdjęcia z komputera wgrywamy od razu po utworzeniu inspekcji (do zdjęć z telefonu służy kod QR na jej stronie)
        if (files.length > 0) {
            setProgress("Wgrywanie zdjęć...");

            try {
                await insertPhotos(inspectionId, files);
            } catch (error) {
                setProgress(null);
                setCreated({ id: inspectionId, photoError: getErrorMessage(error, "nie udało się wgrać zdjęć") });
                setIsSubmitting(false);
                return;
            }
        }

        router.push(`/desk/inspections/${inspectionId}`);
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}
                <h1 className="text-2xl font-bold">Nowa inspekcja</h1>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {equipmentItem?.name ?? (equipment.loading ? "…" : "Wypożyczenie")}
                        <RentalStatusBadge status={rental.data.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {formatDate(rental.data.startDate)} – {formatDate(rental.data.dueDate)}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}
                        {created && (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    Inspekcja została dodana, ale zdjęcia się nie wgrały ({created.photoError}).{" "}
                                    <Link href={`/desk/inspections/${created.id}`} className="underline">
                                        Przejdź do inspekcji i dodaj je ponownie.
                                    </Link>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <Label>Typ inspekcji</Label>
                            <Select
                                items={typeItems}
                                value={type}
                                onValueChange={(value) => setType(value as InspectionType | null)}
                            >
                                <SelectTrigger className="w-full sm:w-64" aria-invalid={errors.type ? true : undefined}>
                                    <SelectValue placeholder="Wybierz typ" />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {typeItems.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="notes">Notatki (opcjonalnie)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Opisz stan sprzętu..."
                                value={notes}
                                maxLength={NOTES_MAX_LENGTH}
                                aria-invalid={errors.notes ? true : undefined}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Zdjęcia (opcjonalnie)</Label>
                            <PhotoPicker onChange={setFiles} disabled={isSubmitting} />
                            <p className="text-xs text-muted-foreground">
                                Zdjęcia z telefonu dodasz po utworzeniu inspekcji, skanując kod QR na jej stronie.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitting || created !== null}>
                                {progress ?? (isSubmitting ? "Zapisywanie..." : "Dodaj inspekcję")}
                            </Button>
                            <Link href={rentalHref} className={buttonVariants({ variant: "outline" })}>
                                Anuluj
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
