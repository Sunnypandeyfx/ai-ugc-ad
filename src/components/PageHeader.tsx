export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border bg-grid py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-sm font-medium text-accent">{eyebrow}</p>
        <h1 className="text-balance mt-3 font-display text-4xl leading-tight tracking-tight md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-xl text-fg-muted">{description}</p>
        )}
      </div>
    </div>
  );
}
