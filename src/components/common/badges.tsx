import type { LanguageCode, PipelineStage, Priority, VideoProject } from '@/types';
import {
  LANGUAGE_LABELS,
  LANGUAGE_SHORT,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  STAGE_LABELS,
  STAGE_TONES,
  TRACK_STEP_STATUS_LABELS,
  TRACK_STEP_STATUS_TONES,
} from '@/types';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

export function StageBadge({ stage, className }: { stage: PipelineStage; className?: string }) {
  return (
    <Badge tone={STAGE_TONES[stage]} className={className}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

/**
 * Per-language readiness. Hindi and English are tracked independently, so the
 * pip shows each track's own script state rather than one project-wide status.
 */
export function LanguagePips({ project, className }: { project: VideoProject; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {project.tracks.map((track) => {
        const tone = TRACK_STEP_STATUS_TONES[track.script];
        const classes: Record<string, string> = {
          neutral: 'border-border-strong bg-subtle text-muted-foreground',
          info: 'border-info/30 bg-info-soft text-info',
          success: 'border-success/30 bg-success-soft text-success',
          warning: 'border-warning/30 bg-warning-soft text-warning',
          danger: 'border-danger/30 bg-danger-soft text-danger',
          accent: 'border-primary/30 bg-primary-soft text-primary-soft-foreground',
        };
        return (
          <span
            key={track.language}
            className={cn(
              'rounded border px-1 text-[10px] font-semibold leading-4 tabular',
              classes[tone],
            )}
            title={`${LANGUAGE_LABELS[track.language]} script: ${TRACK_STEP_STATUS_LABELS[track.script]}`}
          >
            {LANGUAGE_SHORT[track.language]}
          </span>
        );
      })}
    </span>
  );
}

export function LanguageList({ languages }: { languages: LanguageCode[] }) {
  return <span>{languages.map((language) => LANGUAGE_LABELS[language]).join(' · ')}</span>;
}
