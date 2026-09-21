import {apiClient} from "@/lib/api-client";
import {PhotoUploadResponse} from "@/lib/validations/common";

// token (z uploadUrl) pozwala wgrać zdjęcia bez logowania, np. z telefonu
export async function insert(id: string, photos: File[], token?: string): Promise<PhotoUploadResponse> {
    const body = new FormData();
    photos.forEach((photo) => body.append("images", photo));

    const path = token
        ? "/rentals/inspection/" + id + "/photos/" + token + "/uploads"
        : "/rentals/inspection/" + id + "/photos/uploads";

    return apiClient<PhotoUploadResponse, FormData>(path, {
        method: "POST",
        body,
    });
}
