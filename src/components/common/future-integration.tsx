import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Marks a control that cannot work until a backend integration exists. Used
 * instead of a disabled button with no explanation, so it is always clear that
 * a feature is unbuilt rather than broken.
 */
export function FutureIntegration({
  label,
  detail,
  className,
}: {
  label: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-dashed border-border-strong bg-subtle/50 px-3 py-2',
        className,
      )}
    >
      <Lock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 text-xs">
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">
          {detail ?? 'Not available in this phase.'}{' '}
          <Link to="/integrations" className="text-primary underline-offset-2 hover:underline">
            See integrations
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
