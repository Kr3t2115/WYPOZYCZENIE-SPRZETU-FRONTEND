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

async function apiClient<ResponseType = unknown, BodyType = unknown>(
    endpoint: string,
    options: ApiClientOptions<BodyType>
): Promise<ResponseType> {
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

    if (!response.ok) {
        const message =
            (data as { message?: string } | null)?.message ??
            `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, data);
    }

    return data as ResponseType;
}

export { apiClient, ApiError };