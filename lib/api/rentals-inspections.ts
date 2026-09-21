import {apiClient} from "@/lib/api-client";
import {UploadTokenResponse} from "@/lib/validations/common";
import {
    RentalInspection,
    RentalInspectionDetails,
    RentalInspectionListResponse,
    UpdateRentalInspection,
    CreateRentalInspection,
} from "@/lib/validations/rentals-inspections";

export async function getRentalsInspections(query: string): Promise<RentalInspectionListResponse> {
    return apiClient<RentalInspectionListResponse, unknown>("/rentals/inspection" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<RentalInspectionDetails> {
    return apiClient<RentalInspectionDetails, unknown>("/rentals/inspection/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateRentalInspection): Promise<RentalInspection> {
    return apiClient<RentalInspection, UpdateRentalInspection>("/rentals/inspection/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateRentalInspection): Promise<RentalInspection> {
    return apiClient<RentalInspection, CreateRentalInspection>("/rentals/inspection", {
        method: "POST",
        body: data,
    });
}

// nowy link do uploadu zdjęć (409, jeśli poprzedni token jest jeszcze ważny)
export async function regenerateUploadToken(id: string): Promise<UploadTokenResponse> {
    return apiClient<UploadTokenResponse, unknown>("/rentals/inspection/" + id + "/regenerate-upload-token", {
        method: "POST",
    });
}
