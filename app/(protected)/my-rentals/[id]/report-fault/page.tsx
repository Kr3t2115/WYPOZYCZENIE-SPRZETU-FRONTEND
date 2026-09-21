import { FaultForm } from "@/components/faults/fault-form";

export default async function ReportFaultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <FaultForm rentalId={id} mode="user" />;
}
