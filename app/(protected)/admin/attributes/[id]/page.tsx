import { AttributeDetails } from "@/components/attributes/attribute-details";

export default async function AttributeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <AttributeDetails id={id} />;
}
