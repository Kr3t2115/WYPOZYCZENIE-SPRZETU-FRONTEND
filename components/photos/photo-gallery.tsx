import { uploadedFileUrl } from "@/lib/uploads";

export function PhotoGallery({ photos }: { photos: { id: string; path: string }[] }) {
    if (photos.length === 0) {
        return <p className="text-sm text-muted-foreground">Brak zdjęć.</p>;
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => {
                const url = uploadedFileUrl(photo.path);

                return (
                    <a
                        key={photo.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square overflow-hidden rounded-lg ring-1 ring-foreground/10"
                    >
                        {/* zdjęcia pochodzą z zewnętrznego hosta API, więc zwykły <img> zamiast next/image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt={`Zdjęcie ${index + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                    </a>
                );
            })}
        </div>
    );
}
