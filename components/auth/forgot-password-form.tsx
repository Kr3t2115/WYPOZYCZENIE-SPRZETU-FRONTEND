"use client"

import { useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { forgotPassword } from "@/lib/api/auth";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // odpowiedź backendu jest zawsze taka sama, niezależnie od tego, czy konto istnieje
    const [sentMessage, setSentMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);

        const result = forgotPasswordSchema.safeParse({ email: email.trim() });

        if (!result.success) {
            return setEmailError(result.error.issues[0]?.message ?? "Podaj poprawny adres email");
        }

        setEmailError(null);
        setIsSubmitting(true);

        try {
            const response = await forgotPassword(result.data);
            setSentMessage(response.message);
        } catch (error) {
            // błędy serwera (np. nieudana wysyłka maila) nie pokazują surowego komunikatu
            setServerError(
                error instanceof ApiError && error.status < 500
                    ? error.message
                    : "Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (sentMessage) {
        return (
            <div className="flex flex-col gap-4">
                <Alert>
                    <AlertDescription>{sentMessage}</AlertDescription>
                </Alert>
                <p className="text-sm text-muted-foreground">
                    Link jest ważny 30 minut. Jeśli wiadomość nie dotarła, sprawdź folder ze spamem.
                </p>
                <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                    Wróć do logowania
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {serverError && (
                <Alert variant="destructive">
                    <AlertDescription>{serverError}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="m@example.com"
                    value={email}
                    disabled={isSubmitting}
                    aria-invalid={emailError ? true : undefined}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wysyłanie..." : "Wyślij link"}
            </Button>
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                Wróć do logowania
            </Link>
        </form>
    );
}
