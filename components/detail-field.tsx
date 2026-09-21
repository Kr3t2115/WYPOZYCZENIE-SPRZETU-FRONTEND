export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{children}</dd>
        </div>
    );
}
