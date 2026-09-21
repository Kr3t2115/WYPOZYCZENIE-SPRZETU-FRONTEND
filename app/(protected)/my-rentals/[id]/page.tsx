import { RentalDetails } from "@/components/rentals/rental-details";

export default async function MyRentalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <RentalDetails id={id} mode="user" />;
}
