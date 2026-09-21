import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReservationForm } from "@/components/reservations/reservation-form";

export default function NewReservationPage() {
    // formularz czyta ?equipmentId= przez useSearchParams, więc wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96 max-w-xl" />}>
            <ReservationForm />
        </Suspense>
    );
}
