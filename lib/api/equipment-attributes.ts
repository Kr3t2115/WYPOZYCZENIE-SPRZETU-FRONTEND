import {apiClient} from "@/lib/api-client";
import {EquipmentAttributeValue} from "@/lib/validations/equipment";
import {EquipmentAttributeListResponse, UpdateEquipmentAttribute, CreateEquipmentAttribute} from "@/lib/validations/equipment-attributes";

export async function getEquipmentAttributes(equipmentId: string, query: string): Promise<EquipmentAttributeListResponse> {
    return apiClient<EquipmentAttributeListResponse, unknown>("/equipment/" + equipmentId + "/attributes" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(equipmentId: string, id: string): Promise<EquipmentAttributeValue> {
    return apiClient<EquipmentAttributeValue, unknown>("/equipment/" + equipmentId + "/attributes/" + id, {
        method: "GET",
    });
}

export async function update(equipmentId: string, id: string, data: UpdateEquipmentAttribute): Promise<EquipmentAttributeValue> {
    return apiClient<EquipmentAttributeValue, UpdateEquipmentAttribute>("/equipment/" + equipmentId + "/attributes/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(equipmentId: string, data: CreateEquipmentAttribute): Promise<EquipmentAttributeValue> {
    return apiClient<EquipmentAttributeValue, CreateEquipmentAttribute>("/equipment/" + equipmentId + "/attributes", {
        method: "POST",
        body: data,
    });
}
