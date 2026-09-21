import { RENTAL_STATUSES, RentalStatus } from "@/lib/validations/rentals";
import { uuidField } from "@/lib/validations/common";

export const RENTALS_PAGE_SIZE = 10;

// Wartości domyślne = brak parametru w URL-u. Stała na poziomie modułu (hook używa jej w zależnościach).
export const DEFAULT_RENTAL_FILTERS = {
    page: 1,
    status: "",
    // np. link z karty sprzętu - pokazywany jako chip do usunięcia
    equipmentId: "",
};

export type RentalFilters = typeof DEFAULT_RENTAL_FILTERS;

export function isRentalStatus(value: string): value is RentalStatus {
    return (RENTAL_STATUSES as readonly string[]).includes(value);
}

export function isEquipmentIdFilter(value: string) {
    return uuidField.safeParse(value).success;
}

// Query string dla GET /rentals. Zły status/uuid wpisany ręcznie w URL jest pomijany zamiast dawać 400.
export function buildRentalQuery(filters: RentalFilters) {
    const params = new URLSearchParams();

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    params.set("page", String(page));
    params.set("limit", String(RENTALS_PAGE_SIZE));

    if (isRentalStatus(filters.status)) params.set("status", filters.status);
    if (isEquipmentIdFilter(filters.equipmentId)) params.set("equipmentId", filters.equipmentId);

    return params.toString();
}
