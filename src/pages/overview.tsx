import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleSlash,
  Clock,
  Eye,
  ListTodo,
  Plus,
  Settings2,
  TriangleAlert,
} from 'lucide-react';
import { useScopedChannelIds, useSnapshot, useFilters } from '@/store/app-store';
import { Badge, Button, EmptyState, Table, TableWrap, Td, Th, Tr } from '@/components/ui';
import { ChannelAvatar, PageHeader, StageBadge } from '@/components/common';
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type PipelineStage,
} from '@/types';
import { countByStage, nextActions, scopeProjects, upcomingReleases, type NextAction } from '@/lib/selectors';
import { missingSetup } from '@/data/channels';
import { formatDateTime, relativeToToday } from '@/lib/date';
import { cn } from '@/lib/utils';

const ACTION_ICON: Record<NextAction['kind'], typeof AlertTriangle> = {
  failed: TriangleAlert,
  blocked: CircleSlash,
  overdue: Clock,
  review: Eye,
  sources: AlertTriangle,
  due_soon: ArrowRight,
  setup: Settings2,
  start: Plus,
};

const SEVERITY_COLOR: Record<NextAction['severity'], string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
  neutral: 'text-muted-foreground',
};

/** Setup fields counted towards "ready"; must match `missingSetup`. */
const SETUP_FIELDS = 7;

export function OverviewPage() {
  const { channels, projects, ideas, settings } = useSnapshot();
  const { channelId } = useFilters();
  const scopedIds = useScopedChannelIds();

  const scopedChannels = useMemo(
    () => channels.filter((channel) => scopedIds.includes(channel.id)),
    [channels, scopedIds],
  );
  const scoped = useMemo(() => scopeProjects(projects, scopedIds), [projects, scopedIds]);
  const actions = useMemo(
    () => nextActions(scoped, scopedChannels, settings),
    [scoped, scopedChannels, settings],
  );
  const stageCounts = useMemo(() => countByStage(scoped), [scoped]);
  const upcoming = useMemo(() => upcomingReleases(scoped, 14), [scoped]);

  const readyChannels = scopedChannels.filter((channel) => missingSetup(channel).length === 0).length;
  const blockedCount = scoped.filter((project) => project.blocker).length;
  const failedCount = scoped.filter((project) => project.failure).length;
  const selected = channels.find((channel) => channel.id === channelId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview"
        description={
          selected
            ? `What needs doing next on ${selected.name}.`
            : 'What needs doing next, across every channel.'
        }
        actions={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/pipeline">
              Open pipeline <ArrowRight />
            </Link>
          </Button>
        }
      />

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Counter label="Channels ready" value={`${readyChannels} / ${scopedChannels.length}`} />
        <Counter label="Ideas" value={ideas.filter((idea) => scopedIds.includes(idea.channelId)).length} />
        <Counter
          label="In production"
          value={stageCounts.research + stageCounts.script + stageCounts.audio + stageCounts.visuals + stageCounts.editing}
        />
        <Counter label="Awaiting review" value={stageCounts.review} />
        <Counter label="Scheduled" value={stageCounts.scheduled} />
        <Counter label="Published" value={stageCounts.published} />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card-surface xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ListTodo className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold">Next up</h2>
              <Badge tone={actions.length ? 'accent' : 'success'}>{actions.length}</Badge>
            </div>
            <p className="text-2xs text-muted-foreground">Most urgent first</p>
          </div>
          {actions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing needs you right now"
              description="Every channel is set up and nothing is blocked, overdue or waiting on review."
            />
          ) : (
            <ol className="divide-y divide-border">
              {actions.map((action) => {
                const Icon = ACTION_ICON[action.kind];
                return (
                  <li key={action.id}>
                    <Link
                      to={action.to}
                      className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-subtle/60"
                    >
                      <Icon className={cn('mt-0.5 size-4 shrink-0', SEVERITY_COLOR[action.severity])} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug">{action.title}</span>
                        <span className="mt-0.5 block text-2xs leading-relaxed text-muted-foreground">
                          {action.detail}
                        </span>
                      </span>
                      <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="space-y-4">
          <section className="card-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Pipeline</h2>
              <span className="text-2xs text-muted-foreground">
                {blockedCount} blocked · {failedCount} failed
              </span>
            </div>
            <ul className="space-y-1.5 p-4">
              {PIPELINE_STAGES.map((stage: PipelineStage) => {
                const count = stageCounts[stage];
                const max = Math.max(1, ...Object.values(stageCounts));
                return (
                  <li key={stage}>
                    <Link
                      to={`/pipeline?stage=${stage}`}
                      className="grid grid-cols-[5.5rem_1fr_1.5rem] items-center gap-2 text-xs hover:text-primary"
                    >
                      <span className="text-muted-foreground">{STAGE_LABELS[stage]}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-subtle">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </span>
                      <span className="tabular text-right font-medium">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Upcoming releases</h2>
              <Link to="/calendar" className="text-2xs text-primary hover:underline">
                Calendar
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                Nothing scheduled in the next 14 days.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.slice(0, 6).map(({ project, slot }) => {
                  const channel = channels.find((item) => item.id === project.channelId)!;
                  return (
                    <li key={project.id}>
                      <Link
                        to={`/pipeline/${project.id}`}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-subtle/60"
                      >
                        <ChannelAvatar channel={channel} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">{project.title}</span>
                          <span className="block text-2xs text-muted-foreground">{formatDateTime(slot)}</span>
                        </span>
                        <Badge tone="info">{relativeToToday(slot.slice(0, 10))}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="card-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Channels</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Setup progress and work per channel. The next due date is the earliest unpublished video.
          </p>
        </div>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Channel</Th>
                <Th>Setup</Th>
                <Th className="text-right">Ideas</Th>
                <Th className="text-right">In production</Th>
                <Th className="text-right">Review</Th>
                <Th className="text-right">Scheduled</Th>
                <Th className="text-right">Published</Th>
                <Th>Next due</Th>
              </tr>
            </thead>
            <tbody>
              {scopedChannels.map((channel) => {
                const channelProjects = scoped.filter((project) => project.channelId === channel.id);
                const counts = countByStage(channelProjects);
                const missing = missingSetup(channel).length;
                const next = channelProjects
                  .filter((project) => project.stage !== 'published' && project.stage !== 'scheduled')
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
                return (
                  <Tr key={channel.id}>
                    <Td>
                      <Link
                        to={`/channels/${channel.slug}`}
                        className="flex items-center gap-2 font-medium hover:text-primary"
                      >
                        <ChannelAvatar channel={channel} size="sm" />
                        <span className="truncate">{channel.name}</span>
                      </Link>
                    </Td>
                    <Td>
                      {missing === 0 ? (
                        <Badge tone="success">Ready</Badge>
                      ) : (
                        <Badge tone="neutral">
                          {SETUP_FIELDS - missing} of {SETUP_FIELDS}
                        </Badge>
                      )}
                    </Td>
                    <Td className="tabular text-right">
                      {ideas.filter((idea) => idea.channelId === channel.id).length}
                    </Td>
                    <Td className="tabular text-right">
                      {counts.research + counts.script + counts.audio + counts.visuals + counts.editing}
                    </Td>
                    <Td className="tabular text-right">{counts.review}</Td>
                    <Td className="tabular text-right">{counts.scheduled}</Td>
                    <Td className="tabular text-right">{counts.published}</Td>
                    <Td>
                      {next ? (
                        <Link to={`/pipeline/${next.id}`} className="flex items-center gap-2 hover:text-primary">
                          <StageBadge stage={next.stage} />
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {relativeToToday(next.dueDate)}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </section>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-surface px-4 py-3">
      <p className="text-2xs font-medium text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold leading-none">{value}</p>
    </div>
  );
}
