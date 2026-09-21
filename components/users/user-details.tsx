"use client"

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailField } from "@/components/detail-field";
import { getErrorMessage, QueryError } from "@/components/query-error";
import { ROLE_LABELS, RoleBadge, UserStatusBadge } from "@/components/users/badges";
import { useAsyncData } from "@/hooks/use-async-data";
import { ApiError } from "@/lib/api-client";
import { getById, update } from "@/lib/api/users";
import { formatDateTime } from "@/lib/date";
import { UpdateUser, updateSchema } from "@/lib/validations/users";
import { ROLE_TYPE, ROLES, useAuth } from "@/store/auth-store";

const roleItems = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

// /admin/users/[id]
export function UserDetails({ id }: { id: string }) {
    const currentUser = useAuth((state) => state.user);

    const user = useAsyncData("user:" + id, () => getById(id));

    // po zapisie dane odświeżają się w tle - do tego czasu zostaje poprzedni stan zamiast szkieletu
    const item = user.data ?? (user.stale?.id === id ? user.stale : undefined);

    // null = bez zmian względem tego, co zapisano w rekordzie
    const [roleDraft, setRoleDraft] = useState<ROLE_TYPE | null>(null);
    const [activeDraft, setActiveDraft] = useState<boolean | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const backLink = (
        <Link
            href="/admin/users"
            className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-fit gap-1"}
        >
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
        </Link>
    );

    if (user.error != null && !item) {
        const notFound = user.error instanceof ApiError && user.error.status === 404;

        return (
            <div className="flex flex-col gap-6 p-6">
                {backLink}
                <QueryError
                    title={notFound ? "Nie znaleziono użytkownika" : "Nie udało się pobrać użytkownika"}
                    error={user.error}
                    onRetry={notFound ? undefined : user.retry}
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

    // własne konto rozpoznajemy po e-mailu (odpowiedź logowania nie zawiera id)
    const isSelf = currentUser?.email === item.email;
    // rolę zmienia tylko IT (sekretariat mógłby sobie nadać uprawnienia IT); własnej roli i statusu nie
    // zmieniamy, żeby nie zablokować sobie dostępu
    const canEditRole = currentUser?.role === "IT_STAFF" && !isSelf;
    const canEditStatus = !isSelf;

    const role = roleDraft ?? item.role;
    const active = activeDraft ?? item.isActive;

    // do API wysyłamy tylko zmienione pola
    const payload: UpdateUser = {};
    if (role !== item.role) payload.role = role;
    if (active !== item.isActive) payload.isActive = active;
    const hasChanges = Object.keys(payload).length > 0;

    // zmiany, o które pytamy jeszcze raz przed zapisem
    const warnings: string[] = [];
    if (payload.isActive === false) {
        warnings.push("Konto zostanie zablokowane - użytkownik od razu straci dostęp do systemu.");
    }
    if (payload.role !== undefined) {
        warnings.push(`Rola zmieni się z „${ROLE_LABELS[item.role]}” na „${ROLE_LABELS[payload.role]}”.`);
    }

    function reset() {
        setRoleDraft(null);
        setActiveDraft(null);
        setConfirming(false);
        setError(null);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSaved(false);

        const result = updateSchema.safeParse(payload);
        if (!result.success) return setError("Nieprawidłowe dane.");

        // ryzykowną zmianę trzeba potwierdzić osobnym krokiem
        if (warnings.length > 0 && !confirming) return setConfirming(true);

        setIsSaving(true);

        try {
            await update(id, result.data);
            reset();
            setSaved(true);
            user.retry();
        } catch (err) {
            setError(getErrorMessage(err, "Nie udało się zapisać zmian."));
            setConfirming(false);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4">
                {backLink}

                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold">{item.email}</h1>
                    <RoleBadge role={item.role} />
                    <UserStatusBadge isActive={item.isActive} />
                </div>
            </div>

            {user.error != null && (
                <QueryError title="Nie udało się odświeżyć danych" error={user.error} onRetry={user.retry} />
            )}

            <div className="grid items-start gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Konto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <DetailField label="E-mail">{item.email}</DetailField>
                            <DetailField label="Rola">
                                <RoleBadge role={item.role} />
                            </DetailField>
                            <DetailField label="Status">
                                <UserStatusBadge isActive={item.isActive} />
                            </DetailField>
                            <DetailField label="Ostatnie logowanie">
                                {item.lastLogin ? formatDateTime(item.lastLogin) : "Nigdy"}
                            </DetailField>
                            <DetailField label="ID">{item.id}</DetailField>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Uprawnienia i dostęp</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
                            {isSelf && (
                                <Alert>
                                    <AlertDescription>
                                        To Twoje konto - nie możesz zmienić własnej roli ani się zablokować.
                                    </AlertDescription>
                                </Alert>
                            )}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {saved && !hasChanges && (
                                <Alert>
                                    <AlertDescription>Zapisano zmiany.</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <Label>Rola</Label>
                                <Select
                                    items={roleItems}
                                    value={role}
                                    disabled={!canEditRole || isSaving || confirming}
                                    onValueChange={(value) => value && setRoleDraft(value as ROLE_TYPE)}
                                >
                                    <SelectTrigger className="w-full sm:w-64">
                                        <SelectValue placeholder="Rola" />
                                    </SelectTrigger>
                                    <SelectContent alignItemWithTrigger={false}>
                                        {roleItems.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!isSelf && !canEditRole && (
                                    <p className="text-xs text-muted-foreground">Rolę użytkownika może zmienić tylko IT.</p>
                                )}
                            </div>

                            <Label className="flex items-center gap-2 font-normal">
                                <Checkbox
                                    checked={active}
                                    disabled={!canEditStatus || isSaving || confirming}
                                    onCheckedChange={setActiveDraft}
                                />
                                Konto aktywne
                            </Label>

                            {confirming && (
                                <Alert variant="destructive">
                                    <AlertTitle>Potwierdź zmiany</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc pl-5">
                                            {warnings.map((warning) => (
                                                <li key={warning}>{warning}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    variant={confirming ? "destructive" : "default"}
                                    disabled={!hasChanges || isSaving}
                                >
                                    {isSaving ? "Zapisywanie..." : confirming ? "Potwierdź i zapisz" : "Zapisz zmiany"}
                                </Button>
                                {(confirming || hasChanges) && (
                                    <Button type="button" variant="outline" disabled={isSaving} onClick={reset}>
                                        {confirming ? "Wróć" : "Cofnij zmiany"}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
