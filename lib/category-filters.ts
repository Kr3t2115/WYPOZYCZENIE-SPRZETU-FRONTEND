import { MIN_TEXT_LENGTH } from "@/lib/equipment-filters";

export const CATEGORIES_PAGE_SIZE = 10;

// Wartości domyślne = brak parametru w URL-u. Stała na poziomie modułu (hook używa jej w zależnościach).
export const DEFAULT_CATEGORY_FILTERS = {
    page: 1,
    name: "",
};

export type CategoryFilters = typeof DEFAULT_CATEGORY_FILTERS;

// Query string dla GET /equipment/categories. Backend filtruje po nazwie (min. 3 znaki) i opisie;
// filtr po kodzie jest w jego schemacie, ale serwis go ignoruje, więc go tu nie ma.
export function buildCategoryQuery(filters: CategoryFilters) {
    const params = new URLSearchParams();

    const page = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    params.set("page", String(page));
    params.set("limit", String(CATEGORIES_PAGE_SIZE));

    const name = filters.name.trim();
    if (name.length >= MIN_TEXT_LENGTH) params.set("name", name);

    return params.toString();
}
