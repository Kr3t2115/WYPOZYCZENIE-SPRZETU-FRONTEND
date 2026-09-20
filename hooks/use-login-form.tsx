"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { loginUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api-client";
import {useAuth} from "@/store/auth-store";

export function useLoginForm() {
    const router = useRouter();
    const setUser = useAuth((state) => state.setUser);

    const [formData, setFormData] = useState<LoginInput>({ email: "", password: "" });
    const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    function handleChange(field: keyof LoginInput, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setServerError(null);
        setErrors({});

        const result = loginSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof LoginInput;
                fieldErrors[field] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);
        try {
            const user = await loginUser(result.data);
            setUser(user.data);
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            setServerError(
                error instanceof ApiError ? error.message : "Coś poszło nie tak. Spróbuj ponownie."
            );
        } finally {
            setIsLoading(false);
        }
    }

    return { formData, errors, serverError, isLoading, handleChange, handleSubmit };
}