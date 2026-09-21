import {apiClient} from "@/lib/api-client";
import {User, UserListResponse, UpdateUser} from "@/lib/validations/users";

export async function getUsers(query: string): Promise<UserListResponse> {
    return apiClient<UserListResponse, unknown>("/users" + (query ? "?" + query : ""), {
        method: "GET",
    });
}

export async function getById(id: string): Promise<User> {
    return apiClient<User, unknown>("/users/" + id, {
        method: "GET",
    });
}

export async function update(id: string, data: UpdateUser): Promise<User> {
    return apiClient<User, UpdateUser>("/users/" + id, {
        method: "PATCH",
        body: data,
    });
}
