import {apiClient} from "@/lib/api-client";
import {Rental, RentalListResponse, UpdateRental, CreateRental} from "@/lib/validations/rentals";

export async function getRentals(query: string): Promise<RentalListResponse> {
    return apiClient<RentalListResponse, unknown>("/rentals" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<Rental> {
    return apiClient<Rental, unknown>("/rentals/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateRental): Promise<Rental> {
    return apiClient<Rental, UpdateRental>("/rentals/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateRental): Promise<Rental> {
    return apiClient<Rental, CreateRental>("/rentals", {
        method: "POST",
        body: data,
    });
}
