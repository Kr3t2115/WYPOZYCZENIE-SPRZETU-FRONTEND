import { InspectionDetails } from "@/components/inspections/inspection-details";

export default async function InspectionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <InspectionDetails id={id} />;
}
