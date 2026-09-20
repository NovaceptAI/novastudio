import { Link } from 'react-router-dom';
import { AlertTriangle, CircleSlash, Clock, GripVertical, MoreHorizontal } from 'lucide-react';
import type { PipelineStage, VideoProject } from '@/types';
import { BLOCKER_REASON_LABELS, PIPELINE_STAGES, STAGE_LABELS, VIDEO_FORMAT_LABELS } from '@/types';
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { ChannelAvatar, LanguagePips, PriorityBadge } from '@/components/common';
import { formatCompactInr, formatDuration } from '@/lib/format';
import { isOverdue, relativeToToday } from '@/lib/date';
import { cn } from '@/lib/utils';
import { CHANNELS_BY_ID } from '@/data/channels';

/**
 * A board card. Stage changes are available both by dragging and from the
 * card's menu, so the board is fully usable from the keyboard.
 */
export function ProjectCard({
  project,
  onStageChange,
  onDragStart,
  dragging,
}: {
  project: VideoProject;
  onStageChange: (stage: PipelineStage) => void;
  onDragStart?: (event: React.DragEvent) => void;
  dragging?: boolean;
}) {
  const channel = CHANNELS_BY_ID[project.channelId];
  const overdue = project.stage !== 'published' && isOverdue(project.dueDate);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      className={cn(
        'group card-surface p-2.5 transition-shadow hover:shadow-pop',
        dragging && 'opacity-40',
        project.failure && 'border-danger/40',
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical
          className="mt-0.5 size-3.5 shrink-0 cursor-grab text-border-strong group-hover:text-muted-foreground"
          aria-hidden
        />
        <Link
          to={`/pipeline/${project.id}`}
          className="min-w-0 flex-1 text-sm font-medium leading-snug hover:text-primary"
        >
          {project.title}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-subtle focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label={`Change stage for ${project.title}`}
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PIPELINE_STAGES.map((stage) => (
              <DropdownMenuItem
                key={stage}
                disabled={stage === project.stage}
                onSelect={() => onStageChange(stage)}
              >
                {STAGE_LABELS[stage]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 flex items-center gap-1.5 pl-5">
        <ChannelAvatar channel={channel} size="sm" />
        <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground">{channel.name}</span>
        <LanguagePips project={project} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
        <Badge tone="neutral">{VIDEO_FORMAT_LABELS[project.format]}</Badge>
        <PriorityBadge priority={project.priority} />
        <Badge tone={overdue ? 'danger' : 'neutral'}>
          <Clock className="size-2.5" />
          {relativeToToday(project.dueDate)}
        </Badge>
      </div>

      <div className="mt-2 flex items-center justify-between pl-5 text-2xs text-muted-foreground">
        <span>{formatDuration(project.targetDurationMinutes)}</span>
        <span className="tabular">{formatCompactInr(project.estimatedCost)}</span>
      </div>

      {(project.blocker || project.failure) && (
        <div className="mt-2 space-y-1 pl-5">
          {project.failure && (
            <p className="flex items-start gap-1 text-2xs leading-snug text-danger">
              <AlertTriangle className="mt-px size-3 shrink-0" aria-hidden />
              <span>Failed: {project.failure.step} job</span>
            </p>
          )}
          {project.blocker && (
            <p className="flex items-start gap-1 text-2xs leading-snug text-warning">
              <CircleSlash className="mt-px size-3 shrink-0" aria-hidden />
              <span>{BLOCKER_REASON_LABELS[project.blocker.reason]}</span>
            </p>
          )}
        </div>
      )}
    </article>
  );
}
