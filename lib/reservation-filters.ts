import { RESERVATION_STATUSES, ReservationStatus } from "@/lib/validations/reservations";
import { uuidField } from "@/lib/validations/common";

export const RESERVATIONS_PAGE_SIZE = 10;

// Wartości domyślne = brak parametru w URL-u. Stała na poziomie modułu (hook używa jej w zależnościach).
export const DEFAULT_RESERVATION_FILTERS = {
    page: 1,
    status: "",
    // np. link z karty sprzętu (/desk/requests?equipmentId=...) - pokazywany jako chip do usunięcia
    equipmentId: "",
};

export type ReservationFilters = typeof DEFAULT_RESERVATION_FILTERS;

export function isReservationStatus(value: string): value is ReservationStatus {
    return (RESERVATION_STATUSES as readonly string[]).includes(value);
}

export function isEquipmentIdFilter(value: string) {
    return uuidField.safeParse(value).success;
}

// Query string dla GET /reservations. Zły status/uuid wpisany ręcznie w URL jest pomijany zamiast dawać 400.
export function buildReservationQuery(filters: ReservationFilters) {
    const params = new URLSearchParams();

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    params.set("page", String(page));
    params.set("limit", String(RESERVATIONS_PAGE_SIZE));

    if (isReservationStatus(filters.status)) params.set("status", filters.status);
    if (isEquipmentIdFilter(filters.equipmentId)) params.set("equipmentId", filters.equipmentId);

    return params.toString();
}
