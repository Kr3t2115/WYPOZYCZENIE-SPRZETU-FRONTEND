'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

type FilterValue = string | number | boolean | undefined | null
type FilterDefaults = Record<string, FilterValue>

export function useQueryFilters<T extends FilterDefaults>(defaults: T) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const filters = useMemo(() => {
        const result = { ...defaults }
        for (const key in defaults) {
            const raw = searchParams.get(key)
            if (raw === null) continue

            const defaultValue = defaults[key]
            if (typeof defaultValue === 'number') {
                result[key] = Number(raw) as T[typeof key]
            } else if (typeof defaultValue === 'boolean') {
                result[key] = (raw === 'true') as T[typeof key]
            } else {
                result[key] = raw as T[typeof key]
            }
        }
        return result
    }, [searchParams, defaults])

    const applyToUrl = useCallback(
        (updates: Partial<T>) => {
            const params = new URLSearchParams(searchParams.toString())

            for (const key in updates) {
                const value = updates[key]
                const isEmpty = value === undefined || value === null || value === ''
                const isDefault = value === defaults[key]

                if (isEmpty || isDefault) {
                    params.delete(key)
                } else {
                    params.set(key, String(value))
                }
            }

            if (!('page' in updates) && 'page' in defaults) {
                params.delete('page')
            }

            router.push(`${pathname}?${params.toString()}`, { scroll: false })
        },
        [searchParams, pathname, router, defaults]
    )

    const setFilter = useCallback(
        <K extends keyof T>(key: K, value: T[K]) => applyToUrl({[key]: value} as unknown as Partial<T>),
        [applyToUrl]
    )

    const resetFilters = useCallback(() => {
        router.push(pathname, { scroll: false })
    }, [pathname, router])

    return { filters, setFilter, setFilters: applyToUrl, resetFilters }
}