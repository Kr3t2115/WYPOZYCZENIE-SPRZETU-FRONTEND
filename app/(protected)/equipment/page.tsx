import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentList } from "@/components/equipment/equipment-list";

export default function EquipmentPage() {
    // useSearchParams (filtry w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <EquipmentList mode="user" />
        </Suspense>
    );
}
