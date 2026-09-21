import { EquipmentDetails } from "@/components/equipment/equipment-details";

export default async function InventoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <EquipmentDetails id={id} mode="desk" />;
}
