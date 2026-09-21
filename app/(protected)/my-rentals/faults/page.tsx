import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FaultList } from "@/components/faults/fault-list";

export default function MyFaultsPage() {
    // useSearchParams (paginacja w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <FaultList mode="user" />
        </Suspense>
    );
}
