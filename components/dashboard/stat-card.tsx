import Link from "next/link";
import {Card, CardContent} from "@/components/ui/card";
import {Skeleton} from "@/components/ui/skeleton";

export function StatCard({
                      title,
                      value,
                      icon: Icon,
                      loading,
                      href,
                  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    // szkielet zamiast wartości, dopóki dane się ładują
    loading?: boolean;
    // cała karta staje się linkiem (np. do przefiltrowanej listy)
    href?: string;
}) {
    const card = (
        <Card className={href ? "transition-colors hover:bg-muted/50" : undefined}>
            <CardContent className="flex items-center justify-between p-6">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    {loading ? (
                        <Skeleton className="h-8 w-12" />
                    ) : (
                        <span className="text-2xl font-bold">{value}</span>
                    )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );

    return href ? <Link href={href} className="block">{card}</Link> : card;
}
