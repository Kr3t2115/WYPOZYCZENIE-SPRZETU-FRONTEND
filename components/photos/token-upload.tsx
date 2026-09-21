"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUploader } from "@/components/photos/photo-uploader";
import { insert as insertFaultPhotos } from "@/lib/api/faults-photos";
import { insert as insertInspectionPhotos } from "@/lib/api/rentals-inspections-photos";

const CONFIG = {
    fault: { title: "Zdjęcia usterki", upload: insertFaultPhotos },
    inspection: { title: "Zdjęcia z inspekcji", upload: insertInspectionPhotos },
};

// Publiczna strona wgrywania zdjęć z telefonu (bez logowania), do której prowadzą linki z backendu:
// /faults/[id]/upload?token=... oraz /rental-inspection/[id]/upload?token=...
export function TokenUpload({ kind, id, token }: { kind: keyof typeof CONFIG; id: string; token?: string }) {
    const config = CONFIG[kind];

    return (
        <div className="flex min-h-dvh items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>{config.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">wypożyczSANie - System Rezerwacji Sprzętu</p>
                </CardHeader>
                <CardContent>
                    {token ? (
                        <PhotoUploader camera upload={(files) => config.upload(id, files, token)} />
                    ) : (
                        <Alert variant="destructive">
                            <AlertTitle>Nieprawidłowy kod</AlertTitle>
                            <AlertDescription>
                                W adresie brakuje tokena. Zeskanuj kod QR jeszcze raz albo wygeneruj nowy na stronie usterki lub inspekcji.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
