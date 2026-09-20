import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * Says plainly that the numbers on screen are seeded, not measured. Used on
 * every screen that shows a metric.
 */
export function DemoDataNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex items-start gap-1.5 rounded-lg border border-border bg-subtle/70 px-2.5 py-1.5 text-2xs leading-relaxed text-muted-foreground',
        className,
      )}
    >
      <FlaskConical className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        {children ?? 'Demo data — these figures are locally seeded, not measured from YouTube.'}
      </span>
    </p>
  );
}

/** A labelled section inside a detail page. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card-surface', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Label/value pair used throughout the detail pages. */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[11rem_1fr] sm:gap-3', className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
