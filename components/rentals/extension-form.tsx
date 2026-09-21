"use client"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/date-picker";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { RentalStatusBadge } from "@/components/rentals/status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { insert } from "@/lib/api/rentals-extensions";
import { formatDate, isoToInputValue, todayInputValue, toApiDate } from "@/lib/date";
import { createSchema } from "@/lib/validations/rentals-extensions";

// Formularz prośby o przedłużenie wypożyczenia (student): /my-rentals/[id]/extend
export function ExtensionForm({ rentalId }: { rentalId: string }) {
    const router = useRouter();

    const rental = useAsyncData("rental:" + rentalId, () => getRentalById(rentalId));
    const equipment = useLookup("equipment", rental.data ? [rental.data.equipmentId] : [], getEquipmentById);

    const [newDueDate, setNewDueDate] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const backLink = (
        <Link
            href={`/my-rentals/${rentalId}`}
            className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
        >
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
                <Skeleton className="h-64 max-w-xl" />
            </div>
        );
    }

    const item = rental.data;
    const equipmentItem = equipment.items.get(item.equipmentId);
    const canExtend = item.status === "ACTIVE" || item.status === "OVERDUE";

    // nowy termin musi być późniejszy niż dzisiaj (wymóg backendu) i niż obecny termin zwrotu
    const currentDue = isoToInputValue(item.dueDate);
    const minDate = [todayInputValue(1), isoToInputValue(item.dueDate, 1)].sort().at(-1) as string;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        if (!newDueDate) return setError("Wybierz nowy termin zwrotu");
        if (newDueDate < minDate) {
            return setError(
                newDueDate <= currentDue
                    ? "Nowy termin musi być późniejszy niż obecny termin zwrotu"
                    : "Nowy termin musi być późniejszy niż dzisiaj"
            );
        }

        const result = createSchema.safeParse({ rentalId, newDueDate: toApiDate(newDueDate) });
        if (!result.success) return setError(result.error.issues[0]?.message ?? "Nieprawidłowa data");

        setError(null);
        setIsSubmitting(true);

        try {
            await insert(result.data);
            router.push("/my-rentals/extensions");
        } catch (err) {
            setServerError(getErrorMessage(err, "Nie udało się wysłać prośby. Spróbuj ponownie."));
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}
                <h1 className="text-2xl font-bold">Przedłużenie wypożyczenia</h1>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        {equipmentItem?.name ?? (equipment.loading ? "…" : "Wypożyczenie")}
                        <RentalStatusBadge status={item.status} />
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Obecny termin zwrotu: {formatDate(item.dueDate)}
                    </p>
                </CardHeader>
                <CardContent>
                    {!canExtend && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Nie można przedłużyć</AlertTitle>
                            <AlertDescription>
                                Przedłużyć można tylko wypożyczenie aktywne lub po terminie.
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                        {serverError && (
                            <Alert variant="destructive">
                                <AlertDescription>{serverError}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="newDueDate">Nowy termin zwrotu</Label>
                            <DatePicker
                                id="newDueDate"
                                min={minDate}
                                value={newDueDate}
                                disabled={!canExtend}
                                aria-invalid={error ? true : undefined}
                                onChange={setNewDueDate}
                            />
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={!canExtend || isSubmitting}>
                                {isSubmitting ? "Wysyłanie..." : "Wyślij prośbę"}
                            </Button>
                            <Link
                                href={`/my-rentals/${rentalId}`}
                                className={buttonVariants({ variant: "outline" })}
                            >
                                Anuluj
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
