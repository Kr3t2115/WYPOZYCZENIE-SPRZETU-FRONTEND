"use client"

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/components/query-error";
import { formatDateTime } from "@/lib/date";
import { UploadTokenResponse } from "@/lib/validations/common";

// jak często odświeżać rekord, gdy kod QR jest ważny (zdjęcia z telefonu mają się pojawiać same)
const POLL_INTERVAL_MS = 5000;

type UploadQrPanelProps = {
    // ścieżka publicznej strony uploadu, np. "/faults/<id>/upload"
    path: string;
    token: string | null;
    tokenExpiry: string | null;
    regenerate: () => Promise<UploadTokenResponse>;
    // po wygenerowaniu nowego tokena rodzic odświeża rekord (token siedzi w odpowiedzi API)
    onRegenerated: () => void;
    // odświeżenie rekordu, gdy kod jest ważny - dzięki temu zdjęcia zrobione telefonem pojawiają się na stronie
    onPoll?: () => void;
};

// Adres, pod który prowadzi kod QR. Telefon musi go otworzyć, więc domyślnie bierzemy adres, pod którym
// otwarto aplikację, a NEXT_PUBLIC_APP_URL pozwala wskazać publiczny (np. adres w sieci lokalnej).
function getBaseUrl() {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    if (configured) return configured;

    return typeof window === "undefined" ? "" : window.location.origin;
}

function isLocalAddress(baseUrl: string) {
    try {
        const { hostname } = new URL(baseUrl);
        return hostname === "localhost" || hostname === "::1" || hostname.startsWith("127.");
    } catch {
        return false;
    }
}

// Kod QR do zeskanowania telefonem: otwiera stronę, na której od razu robi się i wgrywa zdjęcia (bez logowania).
// Token jest ważny 30 minut.
export function UploadQrPanel({ path, token, tokenExpiry, regenerate, onRegenerated, onPoll }: UploadQrPanelProps) {
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const valid = token !== null && tokenExpiry !== null && new Date(tokenExpiry) > new Date();
    const baseUrl = getBaseUrl();
    const url = valid ? `${baseUrl}${path}?token=${token}` : null;

    const pollRef = useRef(onPoll);
    useEffect(() => {
        pollRef.current = onPoll;
    });

    useEffect(() => {
        if (!valid) return;

        const interval = setInterval(() => {
            // nie odpytujemy ukrytej karty
            if (document.visibilityState === "visible") pollRef.current?.();
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [valid]);

    async function handleRegenerate() {
        setIsRegenerating(true);
        setError(null);

        try {
            await regenerate();
            onRegenerated();
        } catch (err) {
            setError(getErrorMessage(err, "Nie udało się wygenerować nowego kodu."));
        } finally {
            setIsRegenerating(false);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {url && tokenExpiry ? (
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    {/* kod musi być czarny na białym niezależnie od motywu, inaczej aparat go nie odczyta */}
                    <div className="rounded-lg bg-white p-3 ring-1 ring-foreground/10">
                        <QRCodeSVG value={url} size={176} level="M" bgColor="#ffffff" fgColor="#000000" />
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                        <p className="font-medium">Zeskanuj kod telefonem</p>
                        <p className="text-muted-foreground">
                            Otworzy się strona, na której zrobisz zdjęcia aparatem i od razu je wgrasz. Zdjęcia pojawią
                            się tutaj same.
                        </p>
                        <p className="text-xs text-muted-foreground">Kod ważny do {formatDateTime(tokenExpiry)}.</p>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">
                        Kod QR wygasł lub został już wykorzystany. Wygeneruj nowy, żeby wgrać zdjęcia z telefonu.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-fit"
                        disabled={isRegenerating}
                        onClick={handleRegenerate}
                    >
                        {isRegenerating ? "Generowanie..." : "Wygeneruj nowy kod QR"}
                    </Button>
                </>
            )}

            {url && isLocalAddress(baseUrl) && (
                <Alert>
                    <AlertTitle>Telefon nie otworzy tego adresu</AlertTitle>
                    <AlertDescription>
                        Kod prowadzi do „{baseUrl}”, a dla telefonu „localhost” to on sam. Otwórz aplikację pod adresem
                        z sieci lokalnej (np. http://192.168.0.10:3000) albo ustaw NEXT_PUBLIC_APP_URL. Telefon musi
                        też mieć dostęp do API (NEXT_PUBLIC_API_URL nie może być localhost), a backend musi
                        dopuszczać ten adres w CORS.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
