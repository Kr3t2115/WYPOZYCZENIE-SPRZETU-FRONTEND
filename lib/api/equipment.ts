import {apiClient} from "@/lib/api-client";
import {Equipment, EquipmentDetails, EquipmentListResponse, UpdateEquipment, CreateEquipment} from "@/lib/validations/equipment";

export async function getEquipments(query: string): Promise<EquipmentListResponse> {
    return apiClient<EquipmentListResponse, unknown>("/equipment" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<EquipmentDetails> {
    return apiClient<EquipmentDetails, unknown>("/equipment/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateEquipment): Promise<Equipment> {
    return apiClient<Equipment, UpdateEquipment>("/equipment/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateEquipment): Promise<Equipment> {
    return apiClient<Equipment, CreateEquipment>("/equipment", {
        method: "POST",
        body: data,
    });
}
