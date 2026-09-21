"use client"

import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DebouncedInput } from "@/components/debounced-input";
import { QueryError } from "@/components/query-error";
import { ROLE_LABELS, RoleBadge, UserStatusBadge } from "@/components/users/badges";
import { useAsyncData } from "@/hooks/use-async-data";
import { useQueryFilters } from "@/hooks/use-query-filters";
import { getUsers } from "@/lib/api/users";
import { formatDateTime } from "@/lib/date";
import {
    DEFAULT_USER_FILTERS,
    filterUsers,
    isRole,
    USERS_FETCH_LIMIT,
    USERS_PAGE_SIZE,
} from "@/lib/user-filters";
import { ROLES, useAuth } from "@/store/auth-store";

const ALL = "all";

const roleItems = [{ value: ALL, label: "Wszystkie role" }, ...ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))];

const statusItems = [
    { value: ALL, label: "Wszystkie konta" },
    { value: "true", label: "Aktywne" },
    { value: "false", label: "Nieaktywne" },
];

// /admin/users - konta użytkowników (IT_STAFF / SECRETARIAT)
export function UserList() {
    const currentUser = useAuth((state) => state.user);
    const { filters, setFilter, resetFilters } = useQueryFilters(DEFAULT_USER_FILTERS);

    // wszystkich naraz - filtrowanie i stronicowanie odbywa się tu (patrz lib/user-filters.ts)
    const users = useAsyncData("users:all", () => getUsers(`limit=${USERS_FETCH_LIMIT}`));

    const all = users.data?.data ?? [];
    const filtered = filterUsers(all, filters);

    const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));
    const requestedPage = Number.isInteger(filters.page) && filters.page > 0 ? filters.page : 1;
    const page = Math.min(requestedPage, totalPages);
    const items = filtered.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE);

    const truncated = users.data !== undefined && users.data.meta.total > users.data.data.length;
    const hasActiveFilters = filters.search !== "" || isRole(filters.role) || filters.isActive !== "";

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">Użytkownicy</h1>
                <p className="text-sm text-muted-foreground">
                    Konta w systemie. Możesz zmienić rolę użytkownika i zablokować lub odblokować jego dostęp.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                        <span className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filtry
                        </span>
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                                <X className="h-4 w-4" />
                                Wyczyść
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="filter-search">E-mail</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <DebouncedInput
                                    id="filter-search"
                                    placeholder="Szukaj po adresie e-mail..."
                                    value={filters.search}
                                    onCommit={(value) => setFilter("search", value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Rola</Label>
                            <Select
                                items={roleItems}
                                value={isRole(filters.role) ? filters.role : ALL}
                                onValueChange={(value) => setFilter("role", !value || value === ALL ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Rola" />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {roleItems.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Status konta</Label>
                            <Select
                                items={statusItems}
                                value={filters.isActive === "true" || filters.isActive === "false" ? filters.isActive : ALL}
                                onValueChange={(value) => setFilter("isActive", !value || value === ALL ? "" : value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    {statusItems.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {users.error != null && (
                <QueryError title="Nie udało się pobrać użytkowników" error={users.error} onRetry={users.retry} />
            )}

            {truncated && users.data && (
                <Alert>
                    <AlertDescription>
                        Wczytano pierwszych {users.data.data.length} z {users.data.meta.total} użytkowników - filtry i
                        wyszukiwanie obejmują tylko ich.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <span>Lista użytkowników</span>
                        {users.data && (
                            <span className="text-sm font-normal text-muted-foreground">
                                {filtered.length} {filtered.length === 1 ? "wynik" : "wyników"}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Rola</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ostatnie logowanie</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!users.data && users.loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={5}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {users.error != null
                                            ? "Nie udało się wczytać listy."
                                            : hasActiveFilters
                                              ? "Brak wyników spełniających kryteria."
                                              : "Brak użytkowników."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.email}
                                            {currentUser?.email === user.email && (
                                                <Badge variant="secondary" className="ml-2">
                                                    Ty
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <RoleBadge role={user.role} />
                                        </TableCell>
                                        <TableCell>
                                            <UserStatusBadge isActive={user.isActive} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.lastLogin ? formatDateTime(user.lastLogin) : "Nigdy"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className={buttonVariants({ variant: "outline", size: "sm" })}
                                            >
                                                Szczegóły
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {users.data && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                                Strona {page} z {totalPages} · {USERS_PAGE_SIZE} na stronę
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setFilter("page", page - 1)}
                                >
                                    Poprzednia
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setFilter("page", page + 1)}
                                >
                                    Następna
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
