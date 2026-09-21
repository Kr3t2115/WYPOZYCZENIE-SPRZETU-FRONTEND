import {apiClient} from "@/lib/api-client";
import {AttributeOption, AttributeOptionListResponse, UpdateAttributeOption, CreateAttributeOption} from "@/lib/validations/attributes-options";

export async function getAttributesOptions(query: string): Promise<AttributeOptionListResponse> {
    return apiClient<AttributeOptionListResponse, unknown>("/equipment/attributes/options" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<AttributeOption> {
    return apiClient<AttributeOption, unknown>("/equipment/attributes/options/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateAttributeOption): Promise<AttributeOption> {
    return apiClient<AttributeOption, UpdateAttributeOption>("/equipment/attributes/options/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateAttributeOption): Promise<AttributeOption> {
    return apiClient<AttributeOption, CreateAttributeOption>("/equipment/attributes/options", {
        method: "POST",
        body: data,
    });
}
