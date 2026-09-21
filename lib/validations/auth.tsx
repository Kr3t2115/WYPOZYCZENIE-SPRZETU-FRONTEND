
import { z } from "zod";
import {ROLE_TYPE} from "@/store/auth-store";

export const loginSchema = z.object({
    email: z.string().email("Podaj poprawny adres email"),
    password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email("Podaj poprawny adres email"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, "Brak tokena"),
        newPassword: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Hasła nie są identyczne",
        path: ["confirmPassword"],
    });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// auth.controller: login zwraca tylko te 4 pola (bez id)
type User = {
    email: string;
    role: ROLE_TYPE;
    firstName: string;
    lastName: string;
}
export type LoginResponse = {
    message: string;
    data: User;
};
