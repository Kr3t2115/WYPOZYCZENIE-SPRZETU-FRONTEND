"use client"

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function Inventory() {
    type EquipmentItem = {
        id: number;
        name: string;
        serial: string;
        category: string;
        status: "available" | "borrowed" | "maintenance";
    };

    const MOCK_DATA: EquipmentItem[] = [
        { id: 1, name: "Laptop Dell Latitude 5420", serial: "SN-2201", category: "laptopy", status: "borrowed" },
        { id: 2, name: "Projektor BenQ MW632ST", serial: "SN-1187", category: "projektory", status: "available" },
        { id: 3, name: "Arduino Uno R3", serial: "SN-0456", category: "mikrokontrolery", status: "available" },
        { id: 4, name: "Kamera Canon EOS 90D", serial: "SN-0771", category: "aparaty", status: "maintenance" },
        { id: 5, name: "Laptop HP EliteBook", serial: "SN-2340", category: "laptopy", status: "available" },
    ];

    const CATEGORIES = [
        { value: "all", label: "Wszystkie kategorie" },
        { value: "laptopy", label: "Laptopy" },
        { value: "projektory", label: "Projektory" },
        { value: "mikrokontrolery", label: "Mikrokontrolery" },
        { value: "aparaty", label: "Aparaty" },
    ];

    const STATUSES = [
        { value: "all", label: "Wszystkie statusy" },
        { value: "available", label: "Dostępny" },
        { value: "borrowed", label: "Wypożyczony" },
        { value: "maintenance", label: "Serwis" },
    ];

    const statusConfig = {
        available: { label: "Dostępny", variant: "default" as const },
        borrowed: { label: "Wypożyczony", variant: "secondary" as const },
        maintenance: { label: "Serwis", variant: "destructive" as const },
    };

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [status, setStatus] = useState("all");

    const filtered = MOCK_DATA.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.serial.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "all" || item.category === category;
        const matchesStatus = status === "all" || item.status === status;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const hasActiveFilters = search !== "" || category !== "all" || status !== "all";

    function resetFilters() {
        setSearch("");
        setCategory("all");
        setStatus("all");
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Filter className="h-4 w-4" />
                        Filtry
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Szukaj po nazwie lub numerze seryjnym..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Szukaj po nazwie lub numerze seryjnym..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Szukaj po nazwie lub numerze seryjnym..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>



                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Kategoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                                <X className="h-4 w-4" />
                                Wyczyść
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Karta tabeli */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Sprzęt</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {filtered.length} {filtered.length === 1 ? "wynik" : "wyników"}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Nr seryjny</TableHead>
                                <TableHead>Kategoria</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Brak wyników spełniających kryteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((item) => {
                                    const cfg = statusConfig[item.status];
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{item.serial}</TableCell>
                                            <TableCell className="capitalize">{item.category}</TableCell>
                                            <TableCell>
                                                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={"/equipments/" + item.serial}>
                                                    <Button variant="outline" size="sm">
                                                        Szczegóły
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}