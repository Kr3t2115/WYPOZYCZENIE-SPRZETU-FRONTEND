import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryList } from "@/components/categories/category-list";

export default function CategoriesPage() {
    // useSearchParams (filtry w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <CategoryList />
        </Suspense>
    );
}
