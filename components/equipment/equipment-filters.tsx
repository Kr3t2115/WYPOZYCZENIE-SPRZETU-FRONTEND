"use client"

import { Filter, Search, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DebouncedInput } from "@/components/debounced-input";
import { EQUIPMENT_STATUS_CONFIG } from "@/components/equipment/status-badge";
import { EquipmentFilters as Filters, isEquipmentStatus, isShortText, MIN_TEXT_LENGTH } from "@/lib/equipment-filters";
import { EQUIPMENT_STATUSES } from "@/lib/validations/equipment";
import { Category } from "@/lib/validations/category";

const ALL = "all";

type EquipmentFiltersProps = {
    filters: Filters;
    setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    resetFilters: () => void;
    categories: Category[] | undefined;
    // filtry dla IT_STAFF/SECRETARIAT: nr inwentarzowy, nr seryjny, status
    desk: boolean;
};

export function EquipmentFilters({ filters, setFilter, resetFilters, categories, desk }: EquipmentFiltersProps) {
    const categoryItems = [
        { value: ALL, label: "Wszystkie kategorie" },
        ...(categories ?? []).map((category) => ({ value: category.id, label: category.name })),
    ];

    const statusItems = [
        { value: ALL, label: "Wszystkie statusy" },
        ...EQUIPMENT_STATUSES.map((status) => ({ value: status, label: EQUIPMENT_STATUS_CONFIG[status].label })),
    ];

    const visibleTextFilters = desk
        ? [filters.name, filters.inventoryNumber, filters.serialNumber]
        : [filters.name];

    const hasActiveFilters =
        visibleTextFilters.some((value) => value !== "") ||
        filters.categoryId !== "" ||
        (desk && filters.status !== "");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtry
                    </span>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                            <X className="h-4 w-4" />
                            Wyczyść
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="filter-name">Nazwa</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <DebouncedInput
                                id="filter-name"
                                placeholder="Szukaj po nazwie..."
                                value={filters.name}
                                onCommit={(value) => setFilter("name", value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {desk && (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="filter-inventory-number">Nr inwentarzowy</Label>
                                <DebouncedInput
                                    id="filter-inventory-number"
                                    placeholder="np. SAN/LAP/000001"
                                    value={filters.inventoryNumber}
                                    onCommit={(value) => setFilter("inventoryNumber", value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="filter-serial-number">Nr seryjny</Label>
                                <DebouncedInput
                                    id="filter-serial-number"
                                    placeholder="Szukaj po nr seryjnym..."
                                    value={filters.serialNumber}
                                    onCommit={(value) => setFilter("serialNumber", value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label>Kategoria</Label>
                        <Select
                            items={categoryItems}
                            // dopóki kategorie się nie załadują, nie pokazujemy surowego uuid z URL-a
                            value={categories ? filters.categoryId || ALL : null}
                            onValueChange={(value) => setFilter("categoryId", !value || value === ALL ? "" : value)}
                            disabled={!categories}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Kategoria" />
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                {categoryItems.map((item) => (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {desk && (
                        <div className="flex flex-col gap-1.5">
                            <Label>Status</Label>
                            <Select
                                items={statusItems}
                                value={isEquipmentStatus(filters.status) ? filters.status : ALL}
                                onValueChange={(value) => setFilter("status", !value || value === ALL ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {statusItems.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {visibleTextFilters.some(isShortText) && (
                    <p className="text-xs text-muted-foreground">
                        Filtr tekstowy działa od {MIN_TEXT_LENGTH} znaków.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
