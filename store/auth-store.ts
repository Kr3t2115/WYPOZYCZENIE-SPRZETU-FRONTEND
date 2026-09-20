import { create } from 'zustand'
import { persist } from 'zustand/middleware';


export type ROLE_TYPE= "STUDENT" | "SECRETARIAT" | "IT_STAFF";


export const ROLES: ROLE_TYPE[] = [
    "STUDENT",
    "SECRETARIAT",
    "IT_STAFF",
]

type UserData = {
    email: string;
    role: ROLE_TYPE;
    firstName: string;
    lastName: string;
}

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
    status: Status;
    user: UserData|null;
    setUser: (user: UserData|null) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            status: "loading",
            setUser: (userData) => {
                if (!userData) {
                    return set({ status: "unauthenticated", user: null });
                }

                return set({ status: "authenticated", user: userData });
            },
        }),
        {
            name: "auth-storage",
        }
    )
);