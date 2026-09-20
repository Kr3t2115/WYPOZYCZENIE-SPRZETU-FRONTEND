
import { z } from "zod";
import {ROLES} from "@/store/auth-store";

export const loginSchema = z.object({
    email: z.string().email("Podaj poprawny adres email"),
    password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;

type User = {
    id: string;
    email: string;
    role: ROLES;
    firstName: string;
    lastName: string;
}
export type LoginResponse = {
    message: string;
    data: User;
};
