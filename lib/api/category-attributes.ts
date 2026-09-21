import {apiClient} from "@/lib/api-client";
import {MessageResponse} from "@/lib/validations/common";
import {
    CategoryAttribute,
    CategoryAttributeDetails,
    CategoryAttributeListResponse,
    UpdateCategoryAttribute,
    CreateCategoryAttribute,
} from "@/lib/validations/category-attributes";

export async function getCategoryAttributes(query: string): Promise<CategoryAttributeListResponse> {
    return apiClient<CategoryAttributeListResponse, unknown>("/equipment/category-attributes" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<CategoryAttributeDetails> {
    return apiClient<CategoryAttributeDetails, unknown>("/equipment/category-attributes/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateCategoryAttribute): Promise<CategoryAttribute> {
    return apiClient<CategoryAttribute, UpdateCategoryAttribute>("/equipment/category-attributes/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateCategoryAttribute): Promise<CategoryAttribute> {
    return apiClient<CategoryAttribute, CreateCategoryAttribute>("/equipment/category-attributes", {
        method: "POST",
        body: data,
    });
}

export async function remove(id: string): Promise<MessageResponse> {
    return apiClient<MessageResponse, unknown>("/equipment/category-attributes/" + id, {
        method: "DELETE",
    });
}
