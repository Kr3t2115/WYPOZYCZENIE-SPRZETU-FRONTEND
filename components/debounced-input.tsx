"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"

type DebouncedInputProps = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
    value: string
    onCommit: (value: string) => void
    delay?: number
}

// Input, który zgłasza zmianę dopiero po chwili bezczynności (żeby nie wołać API/URL przy każdym znaku).
// `value` pochodzi z URL-a - gdy zmieni się z zewnątrz (np. "Wyczyść"), input się zsynchronizuje.
export function DebouncedInput({ value, onCommit, delay = 400, ...props }: DebouncedInputProps) {
    const [local, setLocal] = useState(value)
    const [prevValue, setPrevValue] = useState(value)

    if (value !== prevValue) {
        setPrevValue(value)
        setLocal(value)
    }

    const commitRef = useRef(onCommit)
    useEffect(() => {
        commitRef.current = onCommit
    })

    useEffect(() => {
        if (local === value) return

        const timeout = setTimeout(() => commitRef.current(local), delay)
        return () => clearTimeout(timeout)
    }, [local, value, delay])

    return <Input {...props} value={local} onChange={(e) => setLocal(e.target.value)} />
}
