import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSignedPercent } from '@/lib/format';
import { InfoTip } from '@/components/ui';

interface StatTileProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  /** Period-over-period change; omitted where a comparison makes no sense. */
  changePct?: number;
  /** For metrics where a fall is good, such as cost. */
  invertChange?: boolean;
  footnote?: string;
  className?: string;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  changePct,
  invertChange = false,
  footnote,
  className,
}: StatTileProps) {
  const flat = changePct === undefined || Math.abs(changePct) < 0.05;
  const positive = (changePct ?? 0) > 0 !== invertChange;
  const ChangeIcon = flat ? Minus : (changePct ?? 0) > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn('card-surface p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {hint ? (
            <InfoTip label={hint}>
              <span className="cursor-help border-b border-dotted border-border-strong">{label}</span>
            </InfoTip>
          ) : (
            label
          )}
        </p>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold leading-none tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {changePct !== undefined && (
          <span
            className={cn(
              'tabular inline-flex items-center gap-0.5 text-2xs font-medium',
              flat ? 'text-muted-foreground' : positive ? 'text-success' : 'text-danger',
            )}
          >
            <ChangeIcon className="size-3" aria-hidden />
            {formatSignedPercent(changePct)}
          </span>
        )}
        {footnote && <span className="text-2xs text-muted-foreground">{footnote}</span>}
      </div>
    </div>
  );
}
