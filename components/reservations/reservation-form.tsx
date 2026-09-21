"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { EquipmentStatusBadge } from "@/components/equipment/status-badge";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { useAsyncData } from "@/hooks/use-async-data";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { insert } from "@/lib/api/reservations";
import { addDaysToInputValue, todayInputValue, toApiDate } from "@/lib/date";
import { uuidField } from "@/lib/validations/common";
import { createSchema } from "@/lib/validations/reservations";

type Field = "startDate" | "endDate" | "notes";

const NOTES_MAX_LENGTH = 1000;

export function ReservationForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const equipmentId = searchParams.get("equipmentId") ?? "";
    const validEquipmentId = uuidField.safeParse(equipmentId).success;

    const equipment = useAsyncData(validEquipmentId ? "equipment:" + equipmentId : null, () =>
        getEquipmentById(equipmentId)
    );

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // backend wymaga startu późniejszego niż dziś i końca późniejszego niż start
    const tomorrow = todayInputValue(1);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const nextErrors: Partial<Record<Field, string>> = {};

        if (!startDate) nextErrors.startDate = "Wybierz datę rozpoczęcia";
        else if (startDate < tomorrow) nextErrors.startDate = "Data rozpoczęcia musi być późniejsza niż dzisiaj";

        if (!endDate) nextErrors.endDate = "Wybierz datę zakończenia";
        else if (startDate && endDate <= startDate) {
            nextErrors.endDate = "Data zakończenia musi być późniejsza niż data rozpoczęcia";
        }

        if (Object.keys(nextErrors).length === 0) {
            const result = createSchema.safeParse({
                equipmentId,
                startDate: toApiDate(startDate),
                endDate: toApiDate(endDate),
                notes: notes.trim() || undefined,
            });

            if (!result.success) {
                for (const issue of result.error.issues) {
                    const field = issue.path[0];
                    if (field === "startDate" || field === "endDate" || field === "notes") {
                        nextErrors[field] = issue.message;
                    } else {
                        setServerError("Nieprawidłowy sprzęt. Wybierz go ponownie z listy.");
                    }
                }
            } else {
                setErrors({});
                setIsSubmitting(true);

                try {
                    const created = await insert(result.data);
                    router.push(`/my-reservations/${created.id}`);
                    return;
                } catch (error) {
                    setServerError(getErrorMessage(error, "Nie udało się utworzyć rezerwacji. Spróbuj ponownie."));
                } finally {
                    setIsSubmitting(false);
                }

                return;
            }
        }

        setErrors(nextErrors);
    }

    const backLink = (
        <Link
            href={validEquipmentId ? `/equipment/${equipmentId}` : "/equipment"}
            className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
        >
            <ArrowLeft className="h-4 w-4" />
            Wróć
        </Link>
    );

    if (!validEquipmentId) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Alert>
                    <AlertTitle>Nie wybrano sprzętu</AlertTitle>
                    <AlertDescription>
                        Wybierz sprzęt z <Link href="/equipment" className="underline">listy sprzętów</Link> i użyj przycisku
                        „Zarezerwuj”.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (equipment.error != null) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError title="Nie udało się pobrać sprzętu" error={equipment.error} onRetry={equipment.retry} />
            </div>
        );
    }

    if (!equipment.data) {
        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-80 max-w-xl" />
            </div>
        );
    }

    const item = equipment.data;
    const available = item.status === "AVAILABLE";

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}
                <h1 className="text-2xl font-bold">Nowa rezerwacja</h1>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {item.name}
                        <EquipmentStatusBadge status={item.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {item.category.name} · {item.inventoryNumber}
                    </p>
                </CardHeader>
                <CardContent>
                    {!available && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Sprzęt jest niedostępny</AlertTitle>
                            <AlertDescription>Można rezerwować wyłącznie sprzęt o statusie „Dostępny”.</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="startDate">Od</Label>
                                <DatePicker
                                    id="startDate"
                                    min={tomorrow}
                                    value={startDate}
                                    disabled={!available}
                                    aria-invalid={errors.startDate ? true : undefined}
                                    onChange={(value) => {
                                        setStartDate(value);
                                        // koniec musi być późniejszy niż start
                                        if (endDate && endDate <= value) setEndDate("");
                                    }}
                                />
                                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="endDate">Do</Label>
                                <DatePicker
                                    id="endDate"
                                    min={addDaysToInputValue(startDate || tomorrow, 1)}
                                    value={endDate}
                                    disabled={!available}
                                    aria-invalid={errors.endDate ? true : undefined}
                                    onChange={setEndDate}
                                />
                                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="notes">Uwagi (opcjonalnie)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Do czego potrzebujesz sprzętu?"
                                value={notes}
                                maxLength={NOTES_MAX_LENGTH}
                                disabled={!available}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={!available || isSubmitting}>
                                {isSubmitting ? "Wysyłanie..." : "Zarezerwuj"}
                            </Button>
                            <Link href={`/equipment/${item.id}`} className={buttonVariants({ variant: "outline" })}>
                                Anuluj
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
