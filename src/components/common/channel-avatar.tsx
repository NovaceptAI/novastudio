import type { Channel } from '@/types';
import { cn } from '@/lib/utils';

/**
 * A channel's monogram in its accent colour. No logo files exist in this
 * phase, so the monogram stands in for one everywhere a channel is listed.
 */
interface AvatarChannel {
  branding: Pick<Channel['branding'], 'accentColor' | 'monogram'>;
}

export function ChannelAvatar({
  channel,
  size = 'md',
  className,
}: {
  channel: AvatarChannel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { accentColor, monogram } = channel.branding;

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-lg font-semibold text-white',
        size === 'sm' && 'size-6 text-[10px]',
        size === 'md' && 'size-8 text-xs',
        size === 'lg' && 'size-11 text-sm',
        className,
      )}
      style={{ backgroundColor: accentColor }}
    >
      {monogram}
    </span>
  );
}

/** A small colour chip, for legends and calendar keys. */
export function ChannelDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  );
}
