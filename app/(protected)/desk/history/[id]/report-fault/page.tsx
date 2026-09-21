import { FaultForm } from "@/components/faults/fault-form";

export default async function DeskReportFaultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <FaultForm rentalId={id} mode="desk" />;
}
