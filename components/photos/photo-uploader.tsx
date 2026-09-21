"use client"

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/components/query-error";
import { PhotoUploadResponse } from "@/lib/validations/common";

// limity takie jak w backendzie (upload.lib.js): JPG/PNG/WebP, do 20 plików po max 20 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

type Item = { file: File; url: string };

type PhotoPickerProps = {
    // wołane przy każdej zmianie listy wybranych zdjęć
    onChange: (files: File[]) => void;
    disabled?: boolean;
    // dodatkowy przycisk "Zrób zdjęcie" otwierający aparat (na telefonie; na komputerze zwykły wybór pliku)
    camera?: boolean;
};

// Wybór zdjęć z podglądem i walidacją (typ, rozmiar, liczba). Sam niczego nie wysyła - pliki oddaje przez onChange.
export function PhotoPicker({ onChange, disabled, camera }: PhotoPickerProps) {
    const galleryRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    // podglądy to object URL-e - trzeba je zwalniać przy usuwaniu plików i odmontowaniu komponentu
    const itemsRef = useRef(items);
    useEffect(() => {
        itemsRef.current = items;
    });
    useEffect(() => {
        return () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    }, []);

    function commit(next: Item[]) {
        setItems(next);
        onChange(next.map((item) => item.file));
    }

    function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files ?? []);
        e.target.value = "";

        const nextErrors: string[] = [];
        const accepted: File[] = [];

        for (const file of selected) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                nextErrors.push(`${file.name}: dozwolone są tylko pliki JPG, PNG i WebP`);
            } else if (file.size > MAX_FILE_SIZE) {
                nextErrors.push(`${file.name}: plik jest większy niż 20 MB`);
            } else {
                accepted.push(file);
            }
        }

        const room = Math.max(MAX_FILES - items.length, 0);
        if (accepted.length > room) {
            nextErrors.push(`Można wgrać maksymalnie ${MAX_FILES} zdjęć naraz`);
        }

        setErrors(nextErrors);
        commit([...items, ...accepted.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    }

    function remove(item: Item) {
        URL.revokeObjectURL(item.url);
        commit(items.filter((current) => current !== item));
    }

    const full = items.length >= MAX_FILES;

    return (
        <div className="flex flex-col gap-3">
            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {errors.map((error) => (
                            <p key={error}>{error}</p>
                        ))}
                    </AlertDescription>
                </Alert>
            )}

            {items.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {items.map((item) => (
                        <div
                            key={item.url}
                            className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-foreground/10"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                aria-label={`Usuń ${item.file.name}`}
                                disabled={disabled}
                                onClick={() => remove(item)}
                                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 shadow hover:text-destructive"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <input
                ref={galleryRef}
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                multiple
                className="hidden"
                onChange={handleSelect}
            />
            {camera && (
                <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleSelect}
                />
            )}

            <div className="flex flex-wrap gap-2">
                {camera && (
                    <Button
                        type="button"
                        className="gap-1"
                        disabled={disabled || full}
                        onClick={() => cameraRef.current?.click()}
                    >
                        <Camera className="h-4 w-4" />
                        Zrób zdjęcie
                    </Button>
                )}
                <Button
                    type="button"
                    variant="outline"
                    className="gap-1"
                    disabled={disabled || full}
                    onClick={() => galleryRef.current?.click()}
                >
                    <ImagePlus className="h-4 w-4" />
                    {items.length > 0 ? "Dodaj kolejne" : "Wybierz zdjęcia"}
                </Button>
            </div>
        </div>
    );
}

type PhotoUploaderProps = {
    upload: (files: File[]) => Promise<PhotoUploadResponse>;
    onUploaded?: () => void;
    camera?: boolean;
};

// Wybór zdjęć + natychmiastowe wgranie po kliknięciu "Wgraj" (strona usterki / inspekcji, strona z telefonu)
export function PhotoUploader({ upload, onUploaded, camera }: PhotoUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    // zmiana klucza czyści wybór w PhotoPicker po udanym wgraniu
    const [pickerKey, setPickerKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadedCount, setUploadedCount] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    async function handleUpload() {
        setIsUploading(true);
        setError(null);

        try {
            const result = await upload(files);

            setFiles([]);
            setPickerKey((key) => key + 1);
            setUploadedCount(result.count);
            onUploaded?.();
        } catch (err) {
            setError(getErrorMessage(err, "Nie udało się wgrać zdjęć. Spróbuj ponownie."));
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {uploadedCount !== null && files.length === 0 && (
                <Alert>
                    <AlertDescription>
                        Wgrano {uploadedCount} {uploadedCount === 1 ? "zdjęcie" : "zdjęć"}.
                    </AlertDescription>
                </Alert>
            )}

            <PhotoPicker
                key={pickerKey}
                camera={camera}
                disabled={isUploading}
                onChange={(next) => {
                    setFiles(next);
                    setUploadedCount(null);
                }}
            />

            {files.length > 0 && (
                <Button type="button" className="w-fit" disabled={isUploading} onClick={handleUpload}>
                    {isUploading ? "Wgrywanie..." : `Wgraj (${files.length})`}
                </Button>
            )}
        </div>
    );
}
