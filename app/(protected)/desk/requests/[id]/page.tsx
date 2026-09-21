import { ReservationDetails } from "@/components/reservations/reservation-details";

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <ReservationDetails id={id} mode="desk" />;
}
