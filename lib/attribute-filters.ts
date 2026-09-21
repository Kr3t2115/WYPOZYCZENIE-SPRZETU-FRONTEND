import { ATTRIBUTE_TYPES, AttributeType } from "@/lib/validations/attributes";
import { MIN_TEXT_LENGTH } from "@/lib/equipment-filters";

export const ATTRIBUTES_PAGE_SIZE = 10;

// Wartości domyślne = brak parametru w URL-u. Stała na poziomie modułu (hook używa jej w zależnościach).
export const DEFAULT_ATTRIBUTE_FILTERS = {
    page: 1,
    name: "",
    type: "",
};

export type AttributeFilters = typeof DEFAULT_ATTRIBUTE_FILTERS;

export function isAttributeType(value: string): value is AttributeType {
    return (ATTRIBUTE_TYPES as readonly string[]).includes(value);
}

// Query string dla GET /equipment/attributes. Za krótka nazwa (backend wymaga min. 3 znaków)
// i zły typ wpisany ręcznie w URL są pomijane zamiast dawać 400.
export function buildAttributeQuery(filters: AttributeFilters) {
    const params = new URLSearchParams();

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    params.set("page", String(page));
    params.set("limit", String(ATTRIBUTES_PAGE_SIZE));

    const name = filters.name.trim();
    if (name.length >= MIN_TEXT_LENGTH) params.set("name", name);

    if (isAttributeType(filters.type)) params.set("type", filters.type);

    return params.toString();
}
