"use client"

import { useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import {useAuth} from "@/store/auth-store";


const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export default function Dashboard() {
    const user = useAuth((state) => state.user);
    const hydrated = useHydrated();

    if (!hydrated) return <Skeleton className="m-6 h-96" />;

    switch (user?.role) {
        case "SECRETARIAT":
        case "IT_STAFF":
            return <AdminDashboard/>
        default:
            return <StudentDashboard/>
    }
}
