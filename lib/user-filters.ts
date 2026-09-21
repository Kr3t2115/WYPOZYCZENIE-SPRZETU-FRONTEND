import { ROLE_TYPE, ROLES } from "@/store/auth-store";
import { User } from "@/lib/validations/users";

export const USERS_PAGE_SIZE = 10;

// Backend zwraca użytkowników bez filtrowania (role/isActive są w jego schemacie, ale serwis je ignoruje,
// a po e-mailu nie da się szukać wcale), więc lista pobiera wszystkich naraz i filtruje po stronie klienta.
// Limit zapytania - powyżej tej liczby UI ostrzega, że widzi tylko część użytkowników.
export const USERS_FETCH_LIMIT = 1000;

// Wartości domyślne = brak parametru w URL-u. Stała na poziomie modułu (hook używa jej w zależnościach).
export const DEFAULT_USER_FILTERS = {
    page: 1,
    search: "",
    role: "",
    // "true" / "false" / "" (wszyscy)
    isActive: "",
};

export type UserFilters = typeof DEFAULT_USER_FILTERS;

export function isRole(value: string): value is ROLE_TYPE {
    return (ROLES as readonly string[]).includes(value);
}

export function filterUsers(users: User[], filters: UserFilters) {
    const search = filters.search.trim().toLowerCase();

    return users
        .filter((user) => search === "" || user.email.toLowerCase().includes(search))
        .filter((user) => !isRole(filters.role) || user.role === filters.role)
        .filter((user) => filters.isActive === "" || String(user.isActive) === filters.isActive)
        .sort((a, b) => a.email.localeCompare(b.email, "pl"));
}
