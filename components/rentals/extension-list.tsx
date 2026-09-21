"use client"

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { ExtensionStatusBadge } from "@/components/rentals/extension-status-badge";
import { useAsyncData } from "@/hooks/use-async-data";
import { useLookup } from "@/hooks/use-lookup";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getById as getEquipmentById } from "@/lib/api/equipment";
import { getById as getRentalById } from "@/lib/api/rentals";
import { getRentalsExtensions, update } from "@/lib/api/rentals-extensions";
import { getById as getUserById } from "@/lib/api/users";
import { formatDate } from "@/lib/date";
import { RentalExtension } from "@/lib/validations/rentals-extensions";

const PAGE_SIZE = 10;
const REJECT_REASON_MAX_LENGTH = 1000;

// Stała na poziomie modułu (useQueryFilters używa jej w zależnościach). Backend obsługuje tu tylko paginację.
const DEFAULT_FILTERS = { page: 1 };

type RowProps = {
    item: RentalExtension;
    desk: boolean;
    columnCount: number;
    rentalHref: string;
    equipmentName: React.ReactNode;
    studentEmail: React.ReactNode;
    currentDueDate: React.ReactNode;
    onChanged: () => void;
};

function ExtensionRow({
    item,
    desk,
    columnCount,
    rentalHref,
    equipmentName,
    studentEmail,
    currentDueDate,
    onChanged,
}: RowProps) {
    const [rejecting, setRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function run(data: Parameters<typeof update>[1], fallbackError: string) {
        setIsSubmitting(true);
        setError(null);

        try {
            await update(item.id, data);
            setRejecting(false);
            onChanged();
        } catch (err) {
            setError(getErrorMessage(err, fallbackError));
        } finally {
            setIsSubmitting(false);
        }
    }

    const canReview = desk && item.status === "PENDING";

    return (
        <>
            <TableRow>
                <TableCell className="font-medium">{equipmentName}</TableCell>
                {desk && <TableCell className="text-muted-foreground">{studentEmail}</TableCell>}
                <TableCell className="whitespace-nowrap text-muted-foreground">{currentDueDate}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(item.newDueDate)}</TableCell>
                <TableCell>
                    <div className="flex flex-col items-start gap-1">
                        <ExtensionStatusBadge status={item.status} />
                        {item.rejectReason && (
                            <span className="max-w-56 whitespace-pre-wrap text-xs text-muted-foreground">
                                {item.rejectReason}
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(item.requestedAt)}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                        {canReview && !rejecting && (
                            <>
                                <Button
                                    size="sm"
                                    className="gap-1"
                                    disabled={isSubmitting}
                                    onClick={() => run({ status: "APPROVED" }, "Nie udało się zaakceptować prośby.")}
                                >
                                    <Check className="h-4 w-4" />
                                    Zaakceptuj
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="gap-1"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        setError(null);
                                        setRejecting(true);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                    Odrzuć
                                </Button>
                            </>
                        )}
                        <Link href={rentalHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            Wypożyczenie
                        </Link>
                    </div>
                </TableCell>
            </TableRow>

            {(rejecting || error) && (
                <TableRow>
                    <TableCell colSpan={columnCount}>
                        <div className="flex flex-col gap-3 py-1">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {rejecting && (
                                <>
                                    <Textarea
                                        aria-label="Powód odrzucenia"
                                        placeholder="Podaj studentowi powód odrzucenia..."
                                        value={rejectReason}
                                        maxLength={REJECT_REASON_MAX_LENGTH}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={isSubmitting || rejectReason.trim() === ""}
                                            onClick={() =>
                                                run(
                                                    { status: "REJECTED", rejectReason: rejectReason.trim() },
                                                    "Nie udało się odrzucić prośby."
                                                )
                                            }
                                        >
                                            {isSubmitting ? "Zapisywanie..." : "Potwierdź odrzucenie"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={isSubmitting}
                                            onClick={() => {
                                                setRejecting(false);
                                                setRejectReason("");
                                                setError(null);
                                            }}
                                        >
                                            Wróć
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

// "user" - /my-rentals/extensions (student), "desk" - /desk/extensions (IT_STAFF / SECRETARIAT)
export function ExtensionList({ mode }: { mode: "user" | "desk" }) {
    const desk = mode === "desk";
    const rentalBaseHref = desk ? "/desk/history" : "/my-rentals";
    const columnCount = desk ? 7 : 6;

    const { filters, setFilter } = useQueryFilters(DEFAULT_FILTERS);

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) }).toString();

    const list = useAsyncData("extensions:" + query, () => getRentalsExtensions(query));

    // przy zmianie strony dotychczasowa lista zostaje na ekranie do czasu nowej odpowiedzi
    const response = list.data ?? list.stale;
    const items = response?.data ?? [];
    const meta = response?.meta;

    // przedłużenie zna tylko rentalId: wypożyczenie -> sprzęt (i student dla staffu)
    const rentals = useLookup("rentals", items.map((item) => item.rentalId), getRentalById);
    const rentalItems = items.map((item) => rentals.items.get(item.rentalId));
    const equipment = useLookup(
        "equipment",
        rentalItems.flatMap((rental) => (rental ? [rental.equipmentId] : [])),
        getEquipmentById
    );
    const students = useLookup(
        "users",
        desk ? rentalItems.flatMap((rental) => (rental ? [rental.studentId] : [])) : [],
        getUserById
    );

    const placeholder = (loading: boolean) => (loading ? <Skeleton className="h-6 w-32" /> : "—");

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{desk ? "Przedłużenia wypożyczeń" : "Moje przedłużenia"}</h1>
                <p className="text-sm text-muted-foreground">
                    {desk
                        ? "Prośby studentów o wydłużenie terminu zwrotu - zaakceptuj je lub odrzuć."
                        : "Prośby o przedłużenie, które wysłałeś. Nową złożysz w szczegółach wypożyczenia."}
                </p>
            </div>

            {list.error != null && (
                <QueryError title="Nie udało się pobrać przedłużeń" error={list.error} onRetry={list.retry} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Przedłużenia</span>
                        {meta && (
                            <span className="text-sm font-normal text-muted-foreground">
                                {meta.total} {meta.total === 1 ? "wynik" : "wyników"}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Table className={list.loading && response ? "opacity-60 transition-opacity" : undefined}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sprzęt</TableHead>
                                {desk && <TableHead>Student</TableHead>}
                                <TableHead>Obecny termin</TableHead>
                                <TableHead>Nowy termin</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Złożono</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!response && list.loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={columnCount}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                        {list.error != null
                                            ? "Nie udało się wczytać listy."
                                            : desk
                                              ? "Brak próśb o przedłużenie."
                                              : "Nie masz jeszcze żadnych próśb o przedłużenie."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => {
                                    const rental = rentals.items.get(item.rentalId);
                                    const equipmentItem = rental ? equipment.items.get(rental.equipmentId) : undefined;
                                    const student = rental ? students.items.get(rental.studentId) : undefined;

                                    return (
                                        <ExtensionRow
                                            key={item.id}
                                            item={item}
                                            desk={desk}
                                            columnCount={columnCount}
                                            rentalHref={`${rentalBaseHref}/${item.rentalId}`}
                                            equipmentName={equipmentItem?.name ?? placeholder(rentals.loading || equipment.loading)}
                                            studentEmail={student?.email ?? placeholder(rentals.loading || students.loading)}
                                            currentDueDate={rental ? formatDate(rental.dueDate) : placeholder(rentals.loading)}
                                            onChanged={list.retry}
                                        />
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {meta && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                                Strona {meta.page} z {Math.max(meta.totalPages, 1)} · {PAGE_SIZE} na stronę
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!meta.hasPrevPage || list.loading}
                                    onClick={() => setFilter("page", meta.page - 1)}
                                >
                                    Poprzednia
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!meta.hasNextPage || list.loading}
                                    onClick={() => setFilter("page", meta.page + 1)}
                                >
                                    Następna
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
