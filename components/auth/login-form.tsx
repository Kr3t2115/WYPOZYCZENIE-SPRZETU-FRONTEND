"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useLoginForm } from "@/hooks/use-login-form";
import {useRouter} from "next/navigation";
import {useAuth} from "@/store/auth-store";

export function LoginForm() {
    const { formData, errors, serverError, isLoading, handleChange, handleSubmit } = useLoginForm();

    const router = useRouter();
    const setUser = useAuth((state) => state.setUser);

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
                {serverError && (
                    <p className="text-sm text-red-500 text-center">{serverError}</p>
                )}
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Hasło</Label>
                        <Link
                            href="/forgot-password"
                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        >
                            Zapomniałeś hasła?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logowanie..." : "Zaloguj się"}
                </Button>
                <Button disabled variant="outline" className="w-full" type="button">
                    Zaloguj za pomocą konta Microsoft
                </Button>
            </div>


            <Button className={"m-2"} onClick={() => {
                setUser({
                    email: "test@test.pl",
                    role: "STUDENT",
                    firstName: "Studentka",
                    lastName: "Koźmiński",
                })
                router.push("/dashboard");
                router.refresh();
            }}>
                Boczna furtka machen - STUDENT
            </Button>

            <Button className={"m-2"} onClick={() => {
                setUser({
                    email: "test@test.pl",
                    role: "SECRETARY",
                    firstName: "Simon",
                    lastName: "Amman",
                })
                router.push("/dashboard");
                router.refresh();
            }}>
                Boczna furtka machen - SECRETARY
            </Button>

            <Button className={"m-2"} onClick={() => {
                setUser({
                    email: "test@test.pl",
                    role: "IT_STUFF",
                    firstName: "BBBBBBB",
                    lastName: "BBBBBBBBBBB",
                })
                router.push("/dashboard");
                router.refresh();
            }}>
                Boczna furtka machen - IT_STUFF
            </Button>
        </form>
    );
}