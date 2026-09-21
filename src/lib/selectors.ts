import type {
  Channel,
  DateRange,
  IsoDate,
  PipelineStage,
  VideoProject,
  WorkspaceSettings,
} from '@/types';
import { PIPELINE_STAGES, BLOCKER_REASON_LABELS, STAGE_LABELS } from '@/types';
import { missingSetup } from '@/data/channels';
import { addDays, isOverdue, isWithinRange, today } from './date';
import { sum } from './utils';

export function scopeProjects(projects: VideoProject[], channelIds: string[]): VideoProject[] {
  const allowed = new Set(channelIds);
  return projects.filter((project) => allowed.has(project.channelId));
}

/** Stages that represent work in flight, i.e. not an idea and not out yet. */
export const IN_PRODUCTION_STAGES: PipelineStage[] = [
  'research',
  'script',
  'audio',
  'visuals',
  'editing',
];

export function countByStage(projects: VideoProject[]): Record<PipelineStage, number> {
  const counts = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, 0])) as Record<
    PipelineStage,
    number
  >;
  for (const project of projects) counts[project.stage] += 1;
  return counts;
}

export function inProduction(projects: VideoProject[]): VideoProject[] {
  return projects.filter((project) => IN_PRODUCTION_STAGES.includes(project.stage));
}

export function awaitingReview(projects: VideoProject[]): VideoProject[] {
  return projects.filter((project) => project.stage === 'review');
}

export function scheduled(projects: VideoProject[]): VideoProject[] {
  return projects.filter((project) => project.stage === 'scheduled');
}

export function blocked(projects: VideoProject[]): VideoProject[] {
  return projects.filter((project) => project.blocker !== null);
}

export function failed(projects: VideoProject[]): VideoProject[] {
  return projects.filter((project) => project.failure !== null);
}

/** Projects published inside the range, by their actual publish timestamp. */
export function publishedInRange(projects: VideoProject[], range: DateRange): VideoProject[] {
  return projects.filter(
    (project) => project.publishing.publishedAt && isWithinRange(project.publishing.publishedAt, range),
  );
}

/** Committed spend: estimates for everything still in flight. */
export function committedSpend(projects: VideoProject[]): number {
  return sum(
    projects
      .filter((project) => project.stage !== 'published' && project.stage !== 'idea')
      .map((project) => project.estimatedCost),
  );
}

export interface UpcomingRelease {
  project: VideoProject;
  slot: string;
}

export function upcomingReleases(projects: VideoProject[], days = 14): UpcomingRelease[] {
  const until = addDays(today(), days);
  return projects
    .filter((project) => {
      const slot = project.publishing.scheduledFor;
      return Boolean(slot) && slot!.slice(0, 10) >= today() && slot!.slice(0, 10) <= until;
    })
    .map((project) => ({ project, slot: project.publishing.scheduledFor! }))
    .sort((a, b) => a.slot.localeCompare(b.slot));
}

export type ActionKind =
  | 'failed'
  | 'blocked'
  | 'overdue'
  | 'review'
  | 'due_soon'
  | 'sources'
  | 'setup'
  | 'start';

export interface NextAction {
  id: string;
  kind: ActionKind;
  severity: 'danger' | 'warning' | 'info' | 'neutral';
  title: string;
  detail: string;
  to: string;
  /** Lower sorts first. Ties break on due date. */
  rank: number;
  due?: IsoDate;
}

const RANK: Record<ActionKind, number> = {
  failed: 0,
  blocked: 1,
  overdue: 2,
  review: 3,
  sources: 4,
  due_soon: 5,
  setup: 6,
  start: 7,
};

/**
 * The ordered to-do list behind the Overview: everything that needs a person,
 * most urgent first. Built only from what is actually in the workspace — an
 * empty workspace produces set-up tasks and nothing else.
 */
export function nextActions(
  projects: VideoProject[],
  channels: Channel[],
  settings: WorkspaceSettings,
  dueSoonDays = 7,
): NextAction[] {
  const actions: NextAction[] = [];
  const soon = addDays(today(), dueSoonDays);
  const channelName = (id: string) => channels.find((channel) => channel.id === id)?.name ?? '';

  for (const project of projects) {
    const open = project.stage !== 'published';
    const base = { to: `/pipeline/${project.id}`, due: project.dueDate };

    if (project.failure && settings.notifyOnFailedJob) {
      actions.push({
        ...base,
        id: `failed-${project.id}`,
        kind: 'failed',
        severity: 'danger',
        title: `Fix failed ${project.failure.step} step — ${project.title}`,
        detail: project.failure.message,
        rank: RANK.failed,
      });
    }
    if (project.blocker && settings.notifyOnBlocked) {
      actions.push({
        ...base,
        id: `blocked-${project.id}`,
        kind: 'blocked',
        severity: 'warning',
        title: `Unblock — ${project.title}`,
        detail: `${BLOCKER_REASON_LABELS[project.blocker.reason]}: ${project.blocker.note}`,
        rank: RANK.blocked,
      });
    }
    if (!open || project.stage === 'scheduled') continue;

    if (isOverdue(project.dueDate)) {
      actions.push({
        ...base,
        id: `overdue-${project.id}`,
        kind: 'overdue',
        severity: 'danger',
        title: `Overdue — ${project.title}`,
        detail: `${channelName(project.channelId)} · due ${project.dueDate}, still at ${STAGE_LABELS[project.stage]}`,
        rank: RANK.overdue,
      });
    } else if (project.stage === 'review') {
      actions.push({
        ...base,
        id: `review-${project.id}`,
        kind: 'review',
        severity: 'warning',
        title: `Review and sign off — ${project.title}`,
        detail: `${channelName(project.channelId)} · due ${project.dueDate}`,
        rank: RANK.review,
      });
    } else if (project.dueDate <= soon) {
      actions.push({
        ...base,
        id: `soon-${project.id}`,
        kind: 'due_soon',
        severity: 'info',
        title: `Move forward from ${STAGE_LABELS[project.stage]} — ${project.title}`,
        detail: `${channelName(project.channelId)} · due ${project.dueDate}`,
        rank: RANK.due_soon,
      });
    }

    if (
      settings.requireSourceVerification &&
      (project.stage === 'editing' || project.stage === 'review')
    ) {
      const unverified = project.research.filter((record) => !record.verifiedOn).length;
      if (unverified > 0) {
        actions.push({
          ...base,
          id: `sources-${project.id}`,
          kind: 'sources',
          severity: 'warning',
          title: `Verify ${unverified} source${unverified > 1 ? 's' : ''} — ${project.title}`,
          detail: 'Required before this can be scheduled.',
          rank: RANK.sources,
        });
      }
    }
  }

  for (const channel of channels) {
    if (channel.status === 'archived' || channel.status === 'paused') continue;
    const missing = missingSetup(channel);
    if (missing.length === 0) continue;
    actions.push({
      id: `setup-${channel.id}`,
      kind: 'setup',
      severity: 'neutral',
      title: `Set up ${channel.name}`,
      detail: `Not set yet: ${missing.join(', ')}.`,
      to: `/channels/${channel.slug}?tab=config`,
      rank: RANK.setup,
    });
  }

  if (projects.length === 0) {
    actions.push({
      id: 'start',
      kind: 'start',
      severity: 'neutral',
      title: 'Add your first video',
      detail: 'Create a project, or add ideas to a channel backlog and promote one.',
      to: '/pipeline?new=1',
      rank: RANK.start,
    });
  }

  return actions.sort(
    (a, b) => a.rank - b.rank || (a.due ?? '9999').localeCompare(b.due ?? '9999'),
  );
}

/** Most recently published first, for the channel detail page. */
export function recentlyPublished(projects: VideoProject[], limit = 6): VideoProject[] {
  return projects
    .filter((project) => project.publishing.publishedAt)
    .sort((a, b) => b.publishing.publishedAt!.localeCompare(a.publishing.publishedAt!))
    .slice(0, limit);
}
