"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Result<T> = { key: string; data?: T; error?: unknown }

/**
 * Pobiera dane w przeglądarce (API korzysta z ciasteczek, więc nie da się tego zrobić w Server Component).
 * Zapytanie odpala się od nowa, gdy zmieni się `key` (np. query string). `key === null` wyłącza pobieranie.
 *
 * - `data`  - wynik dla aktualnego `key` (undefined, dopóki się ładuje lub przy błędzie)
 * - `stale` - ostatni udany wynik, dla dowolnego `key` (do pokazania listy podczas zmiany strony)
 */
export function useAsyncData<T>(key: string | null, fetcher: () => Promise<T>) {
    const [result, setResult] = useState<Result<T> | null>(null)
    const [stale, setStale] = useState<T | undefined>(undefined)
    const [nonce, setNonce] = useState(0)

    const fetcherRef = useRef(fetcher)
    useEffect(() => {
        fetcherRef.current = fetcher
    })

    const requestKey = key === null ? null : key + "#" + nonce

    useEffect(() => {
        if (requestKey === null) return

        let ignore = false

        fetcherRef.current().then(
            (data) => {
                if (ignore) return
                setResult({ key: requestKey, data })
                setStale(data)
            },
            (error: unknown) => {
                if (ignore) return
                setResult({ key: requestKey, error })
            }
        )

        return () => {
            ignore = true
        }
    }, [requestKey])

    const retry = useCallback(() => setNonce((n) => n + 1), [])

    const current = requestKey !== null && result?.key === requestKey ? result : null

    return {
        data: current?.data,
        error: current?.error,
        stale,
        loading: requestKey !== null && current === null,
        retry,
    }
}
