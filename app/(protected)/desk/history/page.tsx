import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RentalList } from "@/components/rentals/rental-list";

export default function HistoryPage() {
    // useSearchParams (filtry w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <RentalList mode="desk" />
        </Suspense>
    );
}
