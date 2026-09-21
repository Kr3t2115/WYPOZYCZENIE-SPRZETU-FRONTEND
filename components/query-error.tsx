import { AlertCircle } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";

export function getErrorMessage(error: unknown, fallback = "Nie udało się pobrać danych. Spróbuj ponownie.") {
    return error instanceof ApiError ? error.message : fallback;
}

export function QueryError({
    title = "Coś poszło nie tak",
    error,
    onRetry,
}: {
    title?: string;
    error: unknown;
    onRetry?: () => void;
}) {
    return (
        <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            {onRetry && (
                <AlertAction>
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Spróbuj ponownie
                    </Button>
                </AlertAction>
            )}
        </Alert>
    );
}
