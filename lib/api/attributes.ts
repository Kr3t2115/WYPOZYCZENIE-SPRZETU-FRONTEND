import {apiClient} from "@/lib/api-client";
import {Attribute, AttributeDetails, AttributeListResponse, UpdateAttribute, CreateAttribute} from "@/lib/validations/attributes";

export async function getAttributes(query: string): Promise<AttributeListResponse> {
    return apiClient<AttributeListResponse, unknown>("/equipment/attributes" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<AttributeDetails> {
    return apiClient<AttributeDetails, unknown>("/equipment/attributes/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateAttribute): Promise<Attribute> {
    return apiClient<Attribute, UpdateAttribute>("/equipment/attributes/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateAttribute): Promise<Attribute> {
    return apiClient<Attribute, CreateAttribute>("/equipment/attributes", {
        method: "POST",
        body: data,
    });
}
