import { EquipmentDetails } from "@/components/equipment/equipment-details";

export default async function EquipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <EquipmentDetails id={id} mode="user" />;
}
