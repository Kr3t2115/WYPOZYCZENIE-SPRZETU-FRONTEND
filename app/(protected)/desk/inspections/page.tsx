import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InspectionList } from "@/components/inspections/inspection-list";

export default function InspectionsPage() {
    // useSearchParams (paginacja w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <InspectionList />
        </Suspense>
    );
}
