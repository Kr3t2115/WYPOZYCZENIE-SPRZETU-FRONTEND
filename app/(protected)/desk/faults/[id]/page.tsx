import { FaultDetails } from "@/components/faults/fault-details";

export default async function DeskFaultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <FaultDetails id={id} mode="desk" />;
}
