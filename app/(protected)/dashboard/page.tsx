"use client"

import StudentDashboard from "@/components/dashboard/student-dashboard";
import {useAuth} from "@/store/auth-store";

export default function Dashboard() {
    const user = useAuth((state) => state.user);

    switch (user?.role) {
        case "SECRETARY":
        case "IT_STUFF":
            return <StudentDashboard/>
        default:
            return <StudentDashboard/>
    }
}

