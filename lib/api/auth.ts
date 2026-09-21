import { ForgotPasswordInput, LoginInput, LoginResponse, ResetPasswordInput } from "@/lib/validations/auth";
import { MessageResponse } from "@/lib/validations/common";
import {apiClient} from "@/lib/api-client";

export async function loginUser(data: LoginInput): Promise<LoginResponse> {
    return apiClient<LoginResponse, LoginInput>("/auth/login", {
        method: "POST",
        body: data,
    });
}


export async function isLogged(): Promise<MessageResponse> {
    return apiClient<MessageResponse, unknown>("/auth/is-logged", {
        method: "GET",
    });
}

// refresh_token idzie w cookie, nowe tokeny też wracają w cookie
export async function refreshToken(): Promise<MessageResponse> {
    return apiClient<MessageResponse, unknown>("/auth/refresh", {
        method: "POST",
    });
}

export async function logout(): Promise<MessageResponse> {
    return apiClient<MessageResponse, unknown>("/auth/logout", {
        method: "POST",
    });
}

export async function forgotPassword(data: ForgotPasswordInput): Promise<MessageResponse> {
    return apiClient<MessageResponse, ForgotPasswordInput>("/auth/forgot-password", {
        method: "POST",
        body: data,
    });
}

// 200 = token prawidłowy, w innym wypadku ApiError
export async function verifyResetToken(token: string): Promise<MessageResponse> {
    return apiClient<MessageResponse, unknown>("/auth/reset-password/" + token, {
        method: "GET",
    });
}

export async function resetPassword(data: ResetPasswordInput): Promise<MessageResponse> {
    return apiClient<MessageResponse, ResetPasswordInput>("/auth/reset-password", {
        method: "POST",
        body: data,
    });
}
