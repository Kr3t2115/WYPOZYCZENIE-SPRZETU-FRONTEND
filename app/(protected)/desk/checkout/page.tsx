import { redirect } from "next/navigation";

// "Wydaj / Odbierz sprzęt": wydanie zaczyna się od zaakceptowanej rezerwacji (przycisk "Wydaj sprzęt"
// w jej szczegółach), a zwrot przyjmuje się w szczegółach wypożyczenia (/desk/history).
export default function CheckoutPage() {
    redirect("/desk/requests?status=APPROVED");
}
