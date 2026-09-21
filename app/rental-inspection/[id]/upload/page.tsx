import { TokenUpload } from "@/components/photos/token-upload";

export default async function InspectionUploadPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string | string[] }>;
}) {
    const { id } = await params;
    const { token } = await searchParams;

    return <TokenUpload kind="inspection" id={id} token={typeof token === "string" ? token : undefined} />;
}
