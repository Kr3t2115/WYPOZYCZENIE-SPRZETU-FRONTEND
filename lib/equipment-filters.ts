import { EQUIPMENT_STATUSES, EquipmentStatus } from "@/lib/validations/equipment";
import { uuidField } from "@/lib/validations/common";

export const PAGE_SIZE = 10;

// backend (getSchema) odrzuca tekstowe filtry krótsze niż 3 znaki
export const MIN_TEXT_LENGTH = 3;

// Wartości domyślne = brak parametru w URL-u (useQueryFilters usuwa z URL-a parametry równe domyślnym).
// Musi to być stała na poziomie modułu - hook używa jej w zależnościach.
export const DEFAULT_EQUIPMENT_FILTERS = {
    page: 1,
    name: "",
    inventoryNumber: "",
    serialNumber: "",
    categoryId: "",
    status: "",
};

export type EquipmentFilters = typeof DEFAULT_EQUIPMENT_FILTERS;

export function isEquipmentStatus(value: string): value is EquipmentStatus {
    return (EQUIPMENT_STATUSES as readonly string[]).includes(value);
}

export function isShortText(value: string) {
    const length = value.trim().length;
    return length > 0 && length < MIN_TEXT_LENGTH;
}

// Składa query string dla GET /equipment. Wartości, które backend odrzuciłby (za krótki tekst,
// zły uuid/status wpisany ręcznie w URL), są pomijane zamiast kończyć się błędem 400.
// Tryb `desk` (IT_STAFF/SECRETARIAT) ma dodatkowe filtry: nr inwentarzowy, nr seryjny i status
// (dla studenta backend i tak zwraca wyłącznie AVAILABLE, a tych pól nie ma w jego UI).
export function buildEquipmentQuery(filters: EquipmentFilters, { desk }: { desk: boolean }) {
    const params = new URLSearchParams();

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    const textFilters = desk
        ? (["name", "inventoryNumber", "serialNumber"] as const)
        : (["name"] as const);

    for (const key of textFilters) {
        const value = filters[key].trim();
        if (value.length >= MIN_TEXT_LENGTH) params.set(key, value);
    }

    if (uuidField.safeParse(filters.categoryId).success) {
        params.set("categoryId", filters.categoryId);
    }

    if (desk && isEquipmentStatus(filters.status)) {
        params.set("status", filters.status);
    }

    return params.toString();
}
