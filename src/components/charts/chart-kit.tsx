import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared chart furniture.
 *
 * The categorical palette is the ten channel accent colours, assigned in the
 * fixed channel order and never cycled or reassigned when a filter changes the
 * number of visible series. That order was checked with the palette validator:
 * every adjacent pair clears the CVD separation threshold on the light surface.
 *
 * A single-series chart carries no legend (the title names it); two or more
 * series always do, so identity is never carried by colour alone.
 */

/** Recessive ink used for axes, grid and tick labels. */
export const AXIS_COLOR = 'hsl(37 6.2% 41%)';
export const GRID_COLOR = 'hsl(40 15.3% 88.4%)';
export const PRIMARY_SERIES = 'hsl(243 75.4% 58.6%)';

export const axisProps = {
  stroke: GRID_COLOR,
  tick: { fill: AXIS_COLOR, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

/** One tooltip style for every chart in the app. */
export function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-2 shadow-pop">
      <p className="text-2xs font-medium text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            {row.color && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{row.label}</span>
            <span className="tabular font-medium text-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartFrame({
  title,
  description,
  legend,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  legend?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card-surface flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="flex-1 p-4 pt-3">{children}</div>
      {legend && <div className="border-t border-border px-4 py-2.5">{legend}</div>}
    </section>
  );
}

/** Legend swatches. Always rendered when a chart carries two or more series. */
export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string }[];
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
