"use client";

import {useAuth} from "@/store/auth-store";
import {
    Laptop,
    Projector,
    Cpu,
    AlertTriangle,
    PackageCheck,
    FileClock,
    History,
    ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {StatCard} from "@/components/dashboard/stat-card";


export default function StudentDashboard() {

    const user = useAuth((state) => state.user);

    const ACTIVE_ITEMS = [
        { id: 1, name: "Laptop Dell Latitude 5420", serial: "SN-2201", borrowedAt: "2026-08-10", dueAt: "2026-08-27", status: "danger" },
        { id: 2, name: "Projektor BenQ MW632ST", serial: "SN-1187", borrowedAt: "2026-08-20", dueAt: "2026-09-01", status: "warning" },
        { id: 3, name: "Mikrokontroler Arduino Uno R3", serial: "SN-0456", borrowedAt: "2026-08-22", dueAt: "2026-09-10", status: "ok" },
    ];

    const RESERVATIONS = [
        { id: 1, name: "Kamera Canon EOS 90D", status: "pending" },
        { id: 2, name: "Statyw Manfrotto", status: "approved", room: "102" },
        { id: 3, name: "Mikrofon Rode NT-USB", status: "rejected" },
    ];

    const QUICK_CATEGORIES = [
        { name: "Laptopy", icon: Laptop, href: "/catalog?category=laptopy" },
        { name: "Projektory", icon: Projector, href: "/catalog?category=projektory" },
        { name: "Mikrokontrolery", icon: Cpu, href: "/catalog?category=mikrokontrolery" },
    ];

    const statusConfig = {
        ok: { label: "Spokojnie", className: "text-green-600 dark:text-green-500", badge: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20" },
        warning: { label: "Zbliża się termin", className: "text-orange-600 dark:text-orange-500", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20" },
        danger: { label: "Przeterminowane / pilne", className: "text-red-600 dark:text-red-500", badge: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20" },
    } as const;

    const reservationStatusConfig = {
        pending: { label: "Oczekuje na akceptację", variant: "secondary" as const },
        approved: { label: "Zatwierdzona", variant: "default" as const },
        rejected: { label: "Odrzucona", variant: "destructive" as const },
    };

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    return (
        <div>
            <div className="flex flex-col gap-6 p-6">
                {/* Boks alertów */}
                <Alert variant="destructive" className="border-red-500/50 text-red-600 dark:text-red-500 [&>svg]:text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Zbliżający się termin zwrotu</AlertTitle>
                    <AlertDescription>
                        Laptop Dell Latitude 5420 musisz oddać do jutra do godz. 15:00.
                    </AlertDescription>
                </Alert>

                {/* Szybkie statystyki */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        title="Aktywnie wypożyczony sprzęt"
                        value={ACTIVE_ITEMS.length}
                        icon={PackageCheck}
                    />
                    <StatCard
                        title="Oczekujące wnioski / rezerwacje"
                        value={RESERVATIONS.filter((r) => r.status === "pending").length}
                        icon={FileClock}
                    />
                    <StatCard
                        title="Historia wszystkich wypożyczeń"
                        value={27}
                        icon={History}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Tabela: Aktualnie u Ciebie */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Aktualnie u Ciebie</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Przedmiot</TableHead>
                                        <TableHead>Wypożyczono</TableHead>
                                        <TableHead>Zwrot do</TableHead>
                                        <TableHead className="text-right">Akcja</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ACTIVE_ITEMS.map((item) => {
                                        const status = statusConfig[item.status as keyof typeof statusConfig];
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.serial}</div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(item.borrowedAt)}
                                                </TableCell>
                                                <TableCell>
                                                <span className={cn("font-medium", status.className)}>
                                                    {formatDate(item.dueAt)}
                                                </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm">
                                                        Poproś o przedłużenie
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Status wniosków + szybki wybór */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status złożonych wniosków</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                {RESERVATIONS.map((res) => {
                                    const cfg = reservationStatusConfig[res.status as keyof typeof reservationStatusConfig];
                                    return (
                                        <div
                                            key={res.id}
                                            className="flex items-center justify-between gap-2 rounded-lg border p-3"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium">{res.name}</span>
                                                {res.status === "approved" && res.room && (
                                                    <span className="text-xs text-muted-foreground">
                                                    Do odbioru w pokoju {res.room}
                                                </span>
                                                )}
                                            </div>
                                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Szybki wybór</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {QUICK_CATEGORIES.map((cat) => {
                                    const Icon = cat.icon;
                                    return (
                                        <Button
                                            key={cat.name}
                                            variant="ghost"
                                            className="justify-between"
                                        >
                                            <a href={cat.href}>
                                            <span className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {cat.name}
                                            </span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </a>
                                        </Button>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
