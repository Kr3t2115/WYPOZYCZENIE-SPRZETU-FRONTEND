"use client"

import { useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncData } from "@/hooks/use-async-data";
import { ApiError } from "@/lib/api-client";
import { resetPassword, verifyResetToken } from "@/lib/api/auth";
import { resetPasswordSchema } from "@/lib/validations/auth";

type Field = "newPassword" | "confirmPassword";

function requestNewLink() {
    return (
        <Link href="/forgot-password" className={buttonVariants({ variant: "outline" })}>
            Poproś o nowy link
        </Link>
    );
}

// Strona z linku z maila. Najpierw sprawdzamy token (żeby nie pokazywać formularza, który i tak się nie uda),
// potem ustawiamy nowe hasło.
export function ResetPasswordForm({ token }: { token?: string }) {
    const verification = useAsyncData(token ? "reset-token:" + token : null, () => verifyResetToken(token as string));

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    if (!token) {
        return (
            <div className="flex flex-col gap-4">
                <Alert variant="destructive">
                    <AlertTitle>Nieprawidłowy link</AlertTitle>
                    <AlertDescription>W adresie brakuje tokena. Użyj linku z wiadomości e-mail.</AlertDescription>
                </Alert>
                {requestNewLink()}
            </div>
        );
    }

    if (done) {
        return (
            <div className="flex flex-col gap-4">
                <Alert>
                    <AlertTitle>Hasło zostało zmienione</AlertTitle>
                    <AlertDescription>Możesz się teraz zalogować nowym hasłem.</AlertDescription>
                </Alert>
                <Link href="/login" className={buttonVariants()}>
                    Przejdź do logowania
                </Link>
            </div>
        );
    }

    if (verification.loading) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
        );
    }

    if (verification.error != null) {
        // 400 = token nieprawidłowy, wygasły albo już użyty; inne błędy to problem z połączeniem lub serwerem
        const invalid = verification.error instanceof ApiError && verification.error.status === 400;

        return (
            <div className="flex flex-col gap-4">
                <Alert variant="destructive">
                    <AlertTitle>{invalid ? "Link jest nieprawidłowy lub wygasł" : "Nie udało się sprawdzić linku"}</AlertTitle>
                    <AlertDescription>
                        {invalid
                            ? "Link do resetowania hasła jest ważny 30 minut i można go użyć tylko raz."
                            : "Sprawdź połączenie i spróbuj ponownie."}
                    </AlertDescription>
                </Alert>
                {invalid ? (
                    requestNewLink()
                ) : (
                    <Button variant="outline" onClick={verification.retry}>
                        Spróbuj ponownie
                    </Button>
                )}
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = resetPasswordSchema.safeParse({ token, newPassword, confirmPassword });

        if (!result.success) {
            const nextErrors: Partial<Record<Field, string>> = {};

            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === "newPassword" || field === "confirmPassword") nextErrors[field] ??= issue.message;
            }

            return setErrors(nextErrors);
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            await resetPassword(result.data);
            setDone(true);
        } catch (error) {
            setServerError(
                error instanceof ApiError && error.status < 500
                    ? error.message
                    : "Nie udało się zmienić hasła. Spróbuj ponownie za chwilę."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {serverError && (
                <Alert variant="destructive">
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-2">
                <Label htmlFor="newPassword">Nowe hasło</Label>
                <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    disabled={isSubmitting}
                    aria-invalid={errors.newPassword ? true : undefined}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                {errors.newPassword ? (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                ) : (
                    <p className="text-xs text-muted-foreground">Co najmniej 8 znaków.</p>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    disabled={isSubmitting}
                    aria-invalid={errors.confirmPassword ? true : undefined}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Label className="flex items-center gap-2 font-normal">
                <Checkbox checked={showPasswords} onCheckedChange={setShowPasswords} />
                Pokaż hasło
            </Label>

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Ustaw nowe hasło"}
            </Button>
        </form>
    );
}
