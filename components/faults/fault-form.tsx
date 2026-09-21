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
import { FAULT_SEVERITY_CONFIG, OCCURRENCE_LABELS } from "@/components/faults/status-badges";
import { PhotoPicker } from "@/components/photos/photo-uploader";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { RentalStatusBadge } from "@/components/rentals/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { insert } from "@/lib/api/faults";
import { insert as insertPhotos } from "@/lib/api/faults-photos";
import { getById as getRentalById } from "@/lib/api/rentals";
import { formatDate } from "@/lib/date";
import {
    createSchema,
    FAULT_SEVERITIES,
    FaultSeverity,
    OCCURRENCE_TYPES,
    OccurrenceType,
} from "@/lib/validations/faults";

type Field = "description" | "severity" | "occurredDuring";

const DESCRIPTION_MAX_LENGTH = 1000;

const severityItems = FAULT_SEVERITIES.map((value) => ({ value, label: FAULT_SEVERITY_CONFIG[value].label }));
const occurrenceItems = OCCURRENCE_TYPES.map((value) => ({ value, label: OCCURRENCE_LABELS[value] }));

// Zgłoszenie usterki do wypożyczenia. "user": /my-rentals/[id]/report-fault, "desk": /desk/history/[id]/report-fault
export function FaultForm({ rentalId, mode }: { rentalId: string; mode: "user" | "desk" }) {
    const router = useRouter();
    const desk = mode === "desk";
    const rentalHref = `${desk ? "/desk/history" : "/my-rentals"}/${rentalId}`;

    const rental = useAsyncData("rental:" + rentalId, () => getRentalById(rentalId));
    const equipment = useLookup("equipment", rental.data ? [rental.data.equipmentId] : [], getEquipmentById);

    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState<FaultSeverity | null>(null);
    const [occurredDuring, setOccurredDuring] = useState<OccurrenceType | null>(null);
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [progress, setProgress] = useState<string | null>(null);
    // usterka już istnieje, ale zdjęcia się nie wgrały - nie można wysłać formularza drugi raz (byłby duplikat)
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
                <Skeleton className="h-96 max-w-xl" />
            </div>
        );
    }

    const equipmentItem = equipment.items.get(rental.data.equipmentId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = createSchema.safeParse({
            rentalId,
            description: description.trim(),
            severity: severity ?? undefined,
            occurredDuring: occurredDuring ?? undefined,
        });

        if (!result.success) {
            const nextErrors: Partial<Record<Field, string>> = {};

            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === "description" || field === "severity" || field === "occurredDuring") {
                    nextErrors[field] ??=
                        field === "description"
                            ? "Opis musi mieć od 10 do 1000 znaków"
                            : field === "severity"
                              ? "Wybierz powagę usterki"
                              : "Wybierz, kiedy usterka wystąpiła";
                }
            }

            return setErrors(nextErrors);
        }

        setErrors({});
        setIsSubmitting(true);

        const detailsHref = desk ? "/desk/faults" : "/my-rentals/faults";
        let faultId: string;

        try {
            const fault = await insert(result.data);
            faultId = fault.id;
        } catch (error) {
            setServerError(getErrorMessage(error, "Nie udało się zgłosić usterki. Spróbuj ponownie."));
            setIsSubmitting(false);
            return;
        }

        // zdjęcia z komputera wgrywamy od razu po utworzeniu usterki (do zdjęć z telefonu służy kod QR na jej stronie)
        if (files.length > 0) {
            setProgress("Wgrywanie zdjęć...");

            try {
                await insertPhotos(faultId, files);
            } catch (error) {
                setProgress(null);
                setCreated({ id: faultId, photoError: getErrorMessage(error, "nie udało się wgrać zdjęć") });
                setIsSubmitting(false);
                return;
            }
        }

        router.push(`${detailsHref}/${faultId}`);
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}
                <h1 className="text-2xl font-bold">Zgłoś usterkę</h1>
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
                                    Usterka została zgłoszona, ale zdjęcia się nie wgrały ({created.photoError}).{" "}
                                    <Link
                                        href={`${desk ? "/desk/faults" : "/my-rentals/faults"}/${created.id}`}
                                        className="underline"
                                    >
                                        Przejdź do usterki i dodaj je ponownie.
                                    </Link>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Powaga</Label>
                                <Select
                                    items={severityItems}
                                    value={severity}
                                    onValueChange={(value) => setSeverity(value as FaultSeverity | null)}
                                >
                                    <SelectTrigger className="w-full" aria-invalid={errors.severity ? true : undefined}>
                                        <SelectValue placeholder="Wybierz powagę" />
                                    </SelectTrigger>
                                    <SelectContent alignItemWithTrigger={false}>
                                        {severityItems.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.severity && <p className="text-sm text-destructive">{errors.severity}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Kiedy wystąpiła</Label>
                                <Select
                                    items={occurrenceItems}
                                    value={occurredDuring}
                                    onValueChange={(value) => setOccurredDuring(value as OccurrenceType | null)}
                                >
                                    <SelectTrigger className="w-full" aria-invalid={errors.occurredDuring ? true : undefined}>
                                        <SelectValue placeholder="Wybierz" />
                                    </SelectTrigger>
                                    <SelectContent alignItemWithTrigger={false}>
                                        {occurrenceItems.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.occurredDuring && (
                                    <p className="text-sm text-destructive">{errors.occurredDuring}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Opis</Label>
                            <Textarea
                                id="description"
                                placeholder="Opisz, co jest uszkodzone i jak do tego doszło..."
                                value={description}
                                maxLength={DESCRIPTION_MAX_LENGTH}
                                aria-invalid={errors.description ? true : undefined}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                        </div>

                        {desk ? (
                            <p className="text-xs text-muted-foreground">
                                Zdjęcia dodasz po zgłoszeniu, na stronie usterki (kodem QR z telefonu).
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <Label>Zdjęcia (opcjonalnie)</Label>
                                <PhotoPicker onChange={setFiles} disabled={isSubmitting} />
                                <p className="text-xs text-muted-foreground">
                                    Zdjęcia z telefonu dodasz po zgłoszeniu, skanując kod QR na stronie usterki.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitting || created !== null}>
                                {progress ?? (isSubmitting ? "Wysyłanie..." : "Zgłoś usterkę")}
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
