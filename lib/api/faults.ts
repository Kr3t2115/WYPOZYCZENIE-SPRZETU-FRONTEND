import {apiClient} from "@/lib/api-client";
import {UploadTokenResponse} from "@/lib/validations/common";
import {Fault, FaultDetails, FaultListResponse, UpdateFault, CreateFault} from "@/lib/validations/faults";

export async function getFaults(query: string): Promise<FaultListResponse> {
    return apiClient<FaultListResponse, unknown>("/faults" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<FaultDetails> {
    return apiClient<FaultDetails, unknown>("/faults/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateFault): Promise<Fault> {
    return apiClient<Fault, UpdateFault>("/faults/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateFault): Promise<Fault> {
    return apiClient<Fault, CreateFault>("/faults", {
        method: "POST",
        body: data,
    });
}

// nowy link do uploadu zdjęć (409, jeśli poprzedni token jest jeszcze ważny)
export async function regenerateUploadToken(id: string): Promise<UploadTokenResponse> {
    return apiClient<UploadTokenResponse, unknown>("/faults/" + id + "/regenerate-upload-token", {
        method: "POST",
    });
}
