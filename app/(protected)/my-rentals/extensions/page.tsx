import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExtensionList } from "@/components/rentals/extension-list";

export default function MyExtensionsPage() {
    // useSearchParams (paginacja w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <ExtensionList mode="user" />
        </Suspense>
    );
}
