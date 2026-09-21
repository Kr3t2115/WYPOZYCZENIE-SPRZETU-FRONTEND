import { useAuth } from "@/store/auth-store";

type ApiClientOptions<BodyType = unknown> = {
    method: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "PATCH";
    body?: BodyType;
    headers?: HeadersInit;
};

class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

// 401 z tych endpointów nie oznacza wygasłego access_tokena: /auth/login = złe dane,
// /auth/refresh = koniec sesji, reszta nie wymaga zalogowania. (/auth/is-logged się odświeża.)
const NO_REFRESH_PREFIXES = [
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
    "/auth/forgot-password",
    "/auth/reset-password",
];

type RefreshOutcome = "ok" | "expired" | "error";

let refreshInFlight: Promise<RefreshOutcome> | null = null;

// Backend rotuje refresh token (stary jest unieważniany), więc równoległe 401 muszą
// współdzielić jedno odświeżenie - drugie, równoległe by się nie udało i wylogowało użytkownika.
function refreshSession(): Promise<RefreshOutcome> {
    if (!refreshInFlight) {
        refreshInFlight = fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/refresh", {
            method: "POST",
            credentials: "include",
        })
            // każda odpowiedź inna niż 200 (401/403 = refresh token wygasł lub unieważniony, 5xx = awaria serwera)
            // oznacza, że sesji nie da się odnowić, a oryginalny request i tak ma 401 - wracamy do logowania
            // zamiast zostawiać użytkownika na stronie z błędem
            .then((response): RefreshOutcome => (response.ok ? "ok" : "expired"))
            // brak sieci to nie powód do wylogowania
            .catch((): RefreshOutcome => "error")
            .finally(() => {
                refreshInFlight = null;
            });
    }

    return refreshInFlight;
}

function handleSessionExpired() {
    useAuth.getState().setUser(null);

    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
    }
}

async function send<BodyType>(endpoint: string, options: ApiClientOptions<BodyType>) {
    const { method, body, headers } = options;

    // FormData (upload zdjęć) - Content-Type z boundary ustawia przeglądarka
    const isFormData = body instanceof FormData;

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + endpoint, {
        method,
        credentials: "include",
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...headers,
        },
        body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data: unknown = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await response.json().catch(() => null);
    }

    return { response, data };
}

async function apiClient<ResponseType = unknown, BodyType = unknown>(
    endpoint: string,
    options: ApiClientOptions<BodyType>
): Promise<ResponseType> {
    let { response, data } = await send(endpoint, options);

    // access_token wygasł -> odśwież sesję i powtórz request (jednokrotnie)
    if (response.status === 401 && !NO_REFRESH_PREFIXES.some((prefix) => endpoint.startsWith(prefix))) {
        const outcome = await refreshSession();

        if (outcome === "ok") {
            ({ response, data } = await send(endpoint, options));

            // po udanym odświeżeniu nadal 401 - sesji nie da się uratować
            if (response.status === 401) handleSessionExpired();
        } else if (outcome === "expired") {
            handleSessionExpired();
        }
    }

    if (!response.ok) {
        const errorBody = data as { message?: string; validationErrors?: Record<string, string> } | null;
        const validationMessage = errorBody?.validationErrors
            ? Object.values(errorBody.validationErrors).join(". ")
            : undefined;

        const message = errorBody?.message ?? validationMessage ?? `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, data);
    }

    return data as ResponseType;
}

export { apiClient, ApiError };
