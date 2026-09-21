import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AttributeList } from "@/components/attributes/attribute-list";

export default function AttributesPage() {
    // useSearchParams (filtry w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <AttributeList />
        </Suspense>
    );
}
