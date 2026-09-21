import { CategoryDetails } from "@/components/categories/category-details";

export default async function CategoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <CategoryDetails id={id} />;
}
