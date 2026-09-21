import {apiClient} from "@/lib/api-client";
import {Reservation, ReservationListResponse, UpdateReservation, CreateReservation} from "@/lib/validations/reservations";

export async function getReservations(query: string): Promise<ReservationListResponse> {
    return apiClient<ReservationListResponse, unknown>("/reservations" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<Reservation> {
    return apiClient<Reservation, unknown>("/reservations/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateReservation): Promise<Reservation> {
    return apiClient<Reservation, UpdateReservation>("/reservations/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateReservation): Promise<Reservation> {
    return apiClient<Reservation, CreateReservation>("/reservations", {
        method: "POST",
        body: data,
    });
}
