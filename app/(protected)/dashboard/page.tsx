"use client"

import StudentDashboard from "@/components/dashboard/student-dashboard";
import {useAuth} from "@/store/auth-store";

export default function Dashboard() {
    const user = useAuth((state) => state.user);

    switch (user?.role) {
        case "SECRETARIAT":
        case "IT_STAFF":
            return <StudentDashboard/>
        default:
            return <StudentDashboard/>
    }
}

