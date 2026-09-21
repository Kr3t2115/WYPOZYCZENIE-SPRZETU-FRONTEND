import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Ramka stron przed zalogowaniem (ten sam układ co ekran logowania)
export function AuthCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="w-full h-dvh flex flex-col justify-center items-center p-4">
            <p className="mb-4 text-sm text-muted-foreground">wypożyczSANie - System Rezerwacji Sprzętu</p>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>{children}</CardContent>
            </Card>
        </div>
    );
}
