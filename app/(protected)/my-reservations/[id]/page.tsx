import { ReservationDetails } from "@/components/reservations/reservation-details";

export default async function MyReservationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <ReservationDetails id={id} mode="user" />;
}
