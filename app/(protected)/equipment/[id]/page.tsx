"use client";

import { useState } from "react";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    PackageCheck,
    Wrench,
    Send,
    Pencil,
    ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Typy ---

type EquipmentStatus = "available" | "borrowed" | "maintenance";

type Spec = {
    label: string;
    value: string;
};

type HistoryEntry = {
    id: number;
    user: string;
    borrowedAt: string;
    returnedAt: string | null;
    dueAt: string;
};

type EquipmentDetails = {
    id: string;
    name: string;
    category: string;
    serial: string;
    status: EquipmentStatus;
    location: string;
    addedAt: string;
    photos: string[];
    specs: Spec[];
    conditionNotes: string;
    history: HistoryEntry[];
};

// --- Mock danych ---

const MOCK_EQUIPMENT: EquipmentDetails = {
    id: "1",
    name: "Laptop Dell Latitude 5420",
    category: "Laptopy",
    serial: "SN-2201",
    status: "borrowed",
    location: "Magazyn IT, regał B3",
    addedAt: "2025-02-10",
    photos: [
        "https://www.shutterstock.com/shutterstock/photos/2627306483/display_1500/stock-photo-a-laptop-on-a-light-gray-surface-softly-lit-with-sunlight-from-the-window-top-view-2627306483.jpg",
        "https://www.shutterstock.com/shutterstock/photos/2419254419/display_1500/stock-vector-modern-laptop-mockup-front-view-computer-screen-laptop-computer-with-empty-screen-laptop-2419254419.jpg",
        "https://www.shutterstock.com/shutterstock/photos/2696807375/display_1500/stock-photo-hands-of-a-man-typing-on-a-laptop-keyboard-while-working-at-a-wooden-desk-in-a-modern-home-office-2696807375.jpg",
    ],
    specs: [
        { label: "Procesor", value: "Intel Core i5-1135G7" },
        { label: "Liczba rdzeni", value: "4" },
        { label: "Liczba wątków", value: "8" },
        { label: "RAM", value: "16 GB DDR4" },
        { label: "Dysk", value: "512 GB SSD NVMe" },
        { label: "Karta graficzna", value: "Intel Iris Xe" },
        { label: "Ekran", value: "14\" FHD 1920x1080" },
        { label: "System operacyjny", value: "Windows 11 Pro" },
    ],
    conditionNotes: "Drobna rysa na obudowie przy zawiasie. Wszystkie porty sprawne.",
    history: [
        { id: 1, user: "Jan Kowalski", borrowedAt: "2026-08-10", returnedAt: null, dueAt: "2026-08-27" },
        { id: 2, user: "Anna Nowak", borrowedAt: "2026-06-01", returnedAt: "2026-06-15", dueAt: "2026-06-15" },
        { id: 3, user: "Piotr Wiśniewski", borrowedAt: "2026-04-12", returnedAt: "2026-04-20", dueAt: "2026-04-19" },
    ],
};

const statusConfig: Record<EquipmentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    available: { label: "Dostępny", variant: "default" },
    borrowed: { label: "Wypożyczony", variant: "secondary" },
    maintenance: { label: "Serwis", variant: "destructive" },
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// --- Komponent główny ---

function EquipmentDetailsPage({ equipment = MOCK_EQUIPMENT }: { equipment?: EquipmentDetails }) {
    const [activePhoto, setActivePhoto] = useState(0);
    const status = statusConfig[equipment.status];

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Powrót + nagłówek */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" className="w-fit gap-1">
                    <Link href="/equipment" className={"flex items-center justify-center gap-2"}>
                        <ArrowLeft className="h-4 w-4" />
                        Wróć do listy
                    </Link>
                </Button>

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{equipment.name}</h1>
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {equipment.category} · {equipment.serial}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-1">
                            <Pencil className="h-4 w-4" />
                            Edytuj
                        </Button>
                        <Button variant="outline" className="gap-1">
                            <Wrench className="h-4 w-4" />
                            Zgłoś serwis
                        </Button>
                        <Button className="gap-1" disabled={equipment.status !== "available"}>
                            <Send className="h-4 w-4" />
                            Wydaj sprzęt
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Galeria zdjęć */}
                <Card className="lg:col-span-2">
                    <CardContent className="flex flex-col gap-3 p-4">
                        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                            {equipment.photos.length > 0 ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={equipment.photos[activePhoto]}
                                    alt={equipment.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-10 w-10" />
                                </div>
                            )}
                        </div>

                        {equipment.photos.length > 1 && (
                            <div className="flex gap-2">
                                {equipment.photos.map((photo, idx) => (
                                    <button
                                        key={photo}
                                        type="button"
                                        onClick={() => setActivePhoto(idx)}
                                        className={cn(
                                            "aspect-square w-16 overflow-hidden rounded-md border-2",
                                            activePhoto === idx ? "border-primary" : "border-transparent"
                                        )}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Podstawowe informacje */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-base">Informacje</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow icon={MapPin} label="Lokalizacja" value={equipment.location} />
                            <InfoRow icon={Calendar} label="Data dodania" value={formatDate(equipment.addedAt)} />
                            <InfoRow icon={PackageCheck} label="Nr seryjny" value={equipment.serial} />
                            <InfoRow icon={Wrench} label="Kategoria" value={equipment.category} />
                        </div>

                        <Separator />

                        <div>
                            <span className="text-sm font-medium">Stan techniczny / uwagi</span>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {equipment.conditionNotes || "Brak uwag."}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Specyfikacja + historia w tabach */}
            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="specs">
                        <div className="border-b px-4 pt-2">
                            <TabsList>
                                <TabsTrigger value="specs">Specyfikacja</TabsTrigger>
                                <TabsTrigger value="history">Historia wypożyczeń</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="specs" className="p-4">
                            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                                {equipment.specs.map((spec) => (
                                    <div
                                        key={spec.label}
                                        className="flex items-center justify-between border-b py-2 text-sm"
                                    >
                                        <dt className="text-muted-foreground">{spec.label}</dt>
                                        <dd className="font-medium">{spec.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </TabsContent>

                        <TabsContent value="history" className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Użytkownik</TableHead>
                                        <TableHead>Wypożyczono</TableHead>
                                        <TableHead>Termin zwrotu</TableHead>
                                        <TableHead>Zwrócono</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {equipment.history.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">{entry.user}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(entry.borrowedAt)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(entry.dueAt)}
                                            </TableCell>
                                            <TableCell>
                                                {entry.returnedAt ? (
                                                    formatDate(entry.returnedAt)
                                                ) : (
                                                    <Badge variant="secondary">W trakcie</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

function InfoRow({
                     icon: Icon,
                     label,
                     value,
                 }: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
            </div>
        </div>
    );
}


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <EquipmentDetailsPage /* equipment={equipment} */ />;
}