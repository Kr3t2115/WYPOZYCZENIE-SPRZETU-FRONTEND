import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

// Adres z maila: /reset-password?token=... (backend składa go z FRONTEND_URL)
export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const { token } = await searchParams;

    return (
        <AuthCard title="Nowe hasło">
            <ResetPasswordForm token={typeof token === "string" ? token : undefined} />
        </AuthCard>
    );
}
