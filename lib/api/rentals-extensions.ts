import {apiClient} from "@/lib/api-client";
import {RentalExtension, RentalExtensionListResponse, UpdateRentalExtension, CreateRentalExtension} from "@/lib/validations/rentals-extensions";

export async function getRentalsExtensions(query: string): Promise<RentalExtensionListResponse> {
    return apiClient<RentalExtensionListResponse, unknown>("/rentals/extensions" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<RentalExtension> {
    return apiClient<RentalExtension, unknown>("/rentals/extensions/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateRentalExtension): Promise<RentalExtension> {
    return apiClient<RentalExtension, UpdateRentalExtension>("/rentals/extensions/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateRentalExtension): Promise<RentalExtension> {
    return apiClient<RentalExtension, CreateRentalExtension>("/rentals/extensions", {
        method: "POST",
        body: data,
    });
}
