import { InspectionForm } from "@/components/inspections/inspection-form";

export default async function NewInspectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <InspectionForm rentalId={id} />;
}
