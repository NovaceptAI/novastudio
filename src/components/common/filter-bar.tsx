import { CalendarRange } from 'lucide-react';
import { DATE_PRESETS, useFilters } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { formatRange } from '@/lib/date';

/**
 * Date-range control. The channel selector lives in the top bar, so the two
 * filters that change what a screen shows are always in the same two places.
 */
export function DateRangeFilter({ className }: { className?: string }) {
  const { rangeDays, setRangeDays, range } = useFilters();

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div
        role="radiogroup"
        aria-label="Date range"
        className="flex items-center rounded-lg border border-border-strong bg-card p-0.5"
      >
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            role="radio"
            aria-checked={rangeDays === preset.days}
            onClick={() => setRangeDays(preset.days)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              rangeDays === preset.days
                ? 'bg-primary-soft text-primary-soft-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <span className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
        <CalendarRange className="size-3.5" aria-hidden />
        {formatRange(range)}
      </span>
    </div>
  );
}
