import {Card, CardContent} from "@/components/ui/card";

export function StatCard({
                      title,
                      value,
                      icon: Icon,
                  }: {
    title: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    <span className="text-2xl font-bold">{value}</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}