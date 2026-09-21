import { FaultDetails } from "@/components/faults/fault-details";

export default async function MyFaultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <FaultDetails id={id} mode="user" />;
}
