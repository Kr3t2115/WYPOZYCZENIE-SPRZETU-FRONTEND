import { RentalDetails } from "@/components/rentals/rental-details";

export default async function HistoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <RentalDetails id={id} mode="desk" />;
}
