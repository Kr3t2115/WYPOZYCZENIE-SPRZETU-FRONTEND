import { LoginInput, LoginResponse } from "@/lib/validations/auth";
import {apiClient} from "@/lib/api-client";

export async function loginUser(data: LoginInput): Promise<LoginResponse> {
    return apiClient<LoginResponse, LoginInput>("/auth/login", {
        method: "POST",
        body: data,
    });
}


export async function isLogged(data: LoginInput): Promise<LoginResponse> {
    return apiClient<LoginResponse, LoginInput>("/auth/is-logged", {
        method: "GET",
    });
}
