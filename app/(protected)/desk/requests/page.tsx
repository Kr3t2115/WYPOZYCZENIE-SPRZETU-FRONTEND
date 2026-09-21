import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationList } from "@/components/reservations/reservation-list";

export default function RequestsPage() {
    // useSearchParams (filtry w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <ReservationList mode="desk" />
        </Suspense>
    );
}
