"use client"

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { pl } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
    id?: string;
    // wartość w formacie "yyyy-mm-dd" (jak w <input type="date">), pusty string = brak daty
    value: string;
    onChange: (value: string) => void;
    // najwcześniejsza dozwolona data, "yyyy-mm-dd" (wcześniejsze dni są wyszarzone)
    min?: string;
    placeholder?: string;
    disabled?: boolean;
    "aria-invalid"?: boolean;
    className?: string;
};

function pad(value: number) {
    return String(value).padStart(2, "0");
}

// "2026-09-21" -> Date w lokalnej strefie (new Date("2026-09-21") dałoby UTC i mogło przesunąć dzień)
function parse(value: string): Date | undefined {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return undefined;

    return new Date(year, month - 1, day);
}

function format(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function DatePicker({
    id,
    value,
    onChange,
    min,
    placeholder = "Wybierz datę",
    disabled,
    "aria-invalid": ariaInvalid,
    className,
}: DatePickerProps) {
    const [open, setOpen] = useState(false);

    const selected = parse(value);
    const minDate = min ? parse(min) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        aria-invalid={ariaInvalid}
                        className={cn(
                            "w-full justify-start gap-2 font-normal",
                            !selected && "text-muted-foreground",
                            className
                        )}
                    />
                }
            >
                <CalendarIcon className="h-4 w-4" />
                {selected
                    ? selected.toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" })
                    : placeholder}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    mode="single"
                    locale={pl}
                    weekStartsOn={1}
                    selected={selected}
                    // otwiera się na miesiącu wybranej daty, a bez niej na pierwszym dozwolonym
                    defaultMonth={selected ?? minDate}
                    disabled={minDate ? { before: minDate } : undefined}
                    onSelect={(date) => {
                        if (!date) return;

                        onChange(format(date));
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
