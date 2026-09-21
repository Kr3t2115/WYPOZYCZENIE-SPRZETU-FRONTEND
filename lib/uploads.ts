// Backend serwuje wgrane pliki spod głównego adresu serwera (/uploads/...), a nie spod /api,
// więc ścieżkę z bazy (np. "/uploads/fault-photos/2026/09/21/abc.jpg") doklejamy do originu API.
export function uploadedFileUrl(path: string) {
    try {
        return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin + path;
    } catch {
        return path;
    }
}
