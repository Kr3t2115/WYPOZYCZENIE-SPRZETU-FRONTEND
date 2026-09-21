import { ExtensionForm } from "@/components/rentals/extension-form";

export default async function ExtendRentalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <ExtensionForm rentalId={id} />;
}
