import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {LoginForm} from "@/components/auth/login-form";

export default function Login() {
    return (
        <div className="w-full h-dvh flex flex-col justify-center items-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>wypożyczSANie - System Rezerwacji Sprzętu</CardTitle>
                </CardHeader>
                <CardContent>
                 <LoginForm/>
                </CardContent>
            </Card>
        </div>
    );
}
