import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserList } from "@/components/users/user-list";

export default function UsersPage() {
    // useSearchParams (filtry w URL-u) wymaga granicy Suspense
    return (
        <Suspense fallback={<Skeleton className="m-6 h-96" />}>
            <UserList />
        </Suspense>
    );
}
