import {apiClient} from "@/lib/api-client";
import {CategoryListResponse, Category, UpdateCategory, CreateCategory} from "@/lib/validations/category";

export async function getCategories(query: string): Promise<CategoryListResponse> {
    return apiClient<CategoryListResponse, unknown>("/equipment/categories" + query ? "/" + query : "", {
        method: "GET",
    });
}

export async function getById(id: string): Promise<Category> {
    return apiClient<Category, unknown>("/equipment/categories/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateCategory): Promise<Category> {
    return apiClient<Category, UpdateCategory>("/equipment/categories/" + id, {
        method: "PATCH",
        body: data,
    });
}

export async function insert(data: CreateCategory): Promise<Category> {
    return apiClient<Category, CreateCategory>("/equipment/categories", {
        method: "GET",
    });
}
