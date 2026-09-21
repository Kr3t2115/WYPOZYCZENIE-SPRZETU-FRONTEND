import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
    return (
        <AuthCard title="Nie pamiętasz hasła?" description="Podaj e-mail konta, a wyślemy link do ustawienia nowego hasła.">
            <ForgotPasswordForm />
        </AuthCard>
    );
}
