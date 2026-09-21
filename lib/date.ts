function pad(value: number) {
    return String(value).padStart(2, "0");
}

// ISO string z API -> "21.09.2026"
export function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// wartość <input type="date"> ("2026-09-21") -> format przyjmowany przez backend ("21-09-2026")
export function toApiDate(inputValue: string) {
    const [year, month, day] = inputValue.split("-");
    return `${day}-${month}-${year}`;
}

// dzisiejsza data w lokalnej strefie jako wartość <input type="date">
// (porównywalna leksykograficznie: "2026-09-22" > "2026-09-21")
export function todayInputValue(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ISO string z API -> wartość <input type="date"> w lokalnej strefie, opcjonalnie przesunięta o dni
export function isoToInputValue(iso: string, offsetDays = 0) {
    const date = new Date(iso);
    date.setDate(date.getDate() + offsetDays);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// przesuwa wartość <input type="date"> ("2026-09-21") o podaną liczbę dni
export function addDaysToInputValue(inputValue: string, days: number) {
    const [year, month, day] = inputValue.split("-").map(Number);
    const date = new Date(year, month - 1, day + days);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ile dni kalendarzowych dzieli dziś od daty (ISO z API): 0 = dziś, 1 = jutro, ujemne = po terminie
export function daysUntil(iso: string) {
    const target = new Date(iso);
    const today = new Date();

    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return Math.round((targetDay - todayDay) / (24 * 60 * 60 * 1000));
}
