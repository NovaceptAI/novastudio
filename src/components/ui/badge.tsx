import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { StatusTone } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-2xs font-medium leading-4',
  {
    variants: {
      tone: {
        neutral: 'border-border-strong bg-subtle text-muted-foreground',
        info: 'border-info/20 bg-info-soft text-info',
        success: 'border-success/20 bg-success-soft text-success',
        warning: 'border-warning/20 bg-warning-soft text-warning',
        danger: 'border-danger/20 bg-danger-soft text-danger',
        accent: 'border-primary/20 bg-primary-soft text-primary-soft-foreground',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, 'tone'> {
  tone?: StatusTone;
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/** A small filled dot in the same tone scale, for dense table rows. */
export function StatusDot({ tone = 'neutral', className }: { tone?: StatusTone; className?: string }) {
  const colors: Record<StatusTone, string> = {
    neutral: 'bg-muted-foreground',
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    accent: 'bg-primary',
  };
  return <span className={cn('size-1.5 shrink-0 rounded-full', colors[tone], className)} aria-hidden />;
}
