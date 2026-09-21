"use client"

import { useAsyncData } from "@/hooks/use-async-data";

/**
 * Dociąga powiązane zasoby po id (np. nazwy sprzętu dla listy rezerwacji, bo backend zwraca same id).
 * Każde unikalne id pobierane jest raz, równolegle. Nieudane pobranie (brak uprawnień, 404) = `undefined`
 * w mapie - reszta wierszy działa normalnie.
 */
export function useLookup<T>(prefix: string, ids: readonly string[], fetcher: (id: string) => Promise<T>) {
    const unique = Array.from(new Set(ids)).sort();
    const key = unique.length > 0 ? prefix + ":" + unique.join(",") : null;

    const { data, stale, loading } = useAsyncData(key, async () => {
        const entries = await Promise.all(
            unique.map(async (id): Promise<readonly [string, T | undefined]> => {
                try {
                    return [id, await fetcher(id)];
                } catch {
                    return [id, undefined];
                }
            })
        );

        return new Map<string, T | undefined>(entries);
    });

    // przy zmianie strony zostają nazwy z poprzedniej, a brakujące doładowują się
    return { items: data ?? stale ?? new Map<string, T | undefined>(), loading };
}
