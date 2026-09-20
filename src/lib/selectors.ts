import type {
  Channel,
  DateRange,
  PipelineStage,
  VideoProject,
  WorkspaceSettings,
} from '@/types';
import { PIPELINE_STAGES, BLOCKER_REASON_LABELS } from '@/types';
import { DEMO_TODAY, addDays, isOverdue, isWithinRange } from './date';
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
  const until = addDays(DEMO_TODAY, days);
  return projects
    .filter((project) => {
      const slot = project.publishing.scheduledFor;
      return Boolean(slot) && slot!.slice(0, 10) >= DEMO_TODAY && slot!.slice(0, 10) <= until;
    })
    .map((project) => ({ project, slot: project.publishing.scheduledFor! }))
    .sort((a, b) => a.slot.localeCompare(b.slot));
}

export type AttentionSeverity = 'danger' | 'warning' | 'info';

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  to: string;
}

/**
 * Everything a producer would want flagged on a Monday morning: failed jobs,
 * blockers, overdue work, unverified sources on projects close to scheduling,
 * channels publishing below their configured cadence, and budget pressure.
 */
export function attentionItems(
  projects: VideoProject[],
  channels: Channel[],
  settings: WorkspaceSettings,
  range: DateRange,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const project of failed(projects)) {
    items.push({
      id: `failed-${project.id}`,
      severity: 'danger',
      title: `${project.failure!.step} job failed — ${project.title}`,
      detail: `${project.failure!.message} (${project.failure!.attempts} attempts)`,
      to: `/pipeline/${project.id}`,
    });
  }

  for (const project of blocked(projects)) {
    items.push({
      id: `blocked-${project.id}`,
      severity: 'warning',
      title: `Blocked: ${BLOCKER_REASON_LABELS[project.blocker!.reason]}`,
      detail: `${project.title} — since ${project.blocker!.since}`,
      to: `/pipeline/${project.id}`,
    });
  }

  for (const project of projects) {
    if (project.stage === 'published' || project.stage === 'scheduled') continue;
    if (!isOverdue(project.dueDate)) continue;
    items.push({
      id: `overdue-${project.id}`,
      severity: 'warning',
      title: `Overdue — ${project.title}`,
      detail: `Due ${project.dueDate}, still at ${project.stage}.`,
      to: `/pipeline/${project.id}`,
    });
  }

  if (settings.requireSourceVerification) {
    for (const project of projects) {
      if (project.stage !== 'review' && project.stage !== 'editing') continue;
      const unverified = project.research.filter((record) => !record.verifiedOn).length;
      if (unverified === 0) continue;
      items.push({
        id: `sources-${project.id}`,
        severity: 'info',
        title: `${unverified} unverified source${unverified > 1 ? 's' : ''} — ${project.title}`,
        detail: 'Verification is required before this can be scheduled.',
        to: `/pipeline/${project.id}`,
      });
    }
  }

  for (const channel of channels) {
    const channelProjects = projects.filter((project) => project.channelId === channel.id);
    const published = publishedInRange(channelProjects, range).length;
    const weeks = Math.max(1, Math.round((new Date(range.to).getTime() - new Date(range.from).getTime()) / 604800000));
    const expected = channel.config.cadence.videosPerWeek * weeks;
    if (channel.status === 'active' && published < expected * 0.6) {
      items.push({
        id: `cadence-${channel.id}`,
        severity: 'info',
        title: `${channel.name} is publishing below cadence`,
        detail: `${published} published in this range against a plan of about ${expected}.`,
        to: `/channels/${channel.slug}`,
      });
    }

    const committed = committedSpend(channelProjects);
    const threshold = (channel.config.monthlyBudget * settings.monthlyBudgetWarnPct) / 100;
    if (committed > threshold) {
      items.push({
        id: `budget-${channel.id}`,
        severity: 'warning',
        title: `${channel.name} is near its monthly budget`,
        detail: `Committed estimates are above ${settings.monthlyBudgetWarnPct}% of the configured budget.`,
        to: `/channels/${channel.slug}`,
      });
    }
  }

  const order: Record<AttentionSeverity, number> = { danger: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Most recently published first, for the channel detail page. */
export function recentlyPublished(projects: VideoProject[], limit = 6): VideoProject[] {
  return projects
    .filter((project) => project.publishing.publishedAt)
    .sort((a, b) => b.publishing.publishedAt!.localeCompare(a.publishing.publishedAt!))
    .slice(0, limit);
}
