import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CircleSlash, KanbanSquare, Plus, Rows3, Search, X } from 'lucide-react';
import { useData, useScopedChannelIds, useSnapshot } from '@/store/app-store';
import {
  BLOCKER_REASON_LABELS,
  LANGUAGE_LABELS,
  PIPELINE_STAGES,
  PRIORITY_LABELS,
  PRIORITY_VALUES,
  PRIORITY_WEIGHT,
  STAGE_DESCRIPTIONS,
  STAGE_LABELS,
  VIDEO_FORMAT_LABELS,
  type LanguageCode,
  type PipelineStage,
  type Priority,
  type VideoFormat,
  type VideoProject,
} from '@/types';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  InfoTip,
  NativeSelect,
  SortableTh,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  useToast,
} from '@/components/ui';
import { ChannelAvatar, LanguagePips, PageHeader, PriorityBadge, StageBadge, Notice } from '@/components/common';
import { ProjectCard } from '@/components/projects/project-card';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { StageChangeError } from '@/services/api';
import { formatCompactInr, formatDuration } from '@/lib/format';
import { isOverdue, relativeToToday } from '@/lib/date';
import { cn, matchesQuery } from '@/lib/utils';
import { blocked, failed, scopeProjects } from '@/lib/selectors';
import { useSortableTable } from '@/hooks/use-sortable-table';

type ViewMode = 'board' | 'table';
type Impediment = 'all' | 'blocked' | 'failed' | 'clear';

/** Published is capped on the board; the archive lives in the table view. */
const PUBLISHED_CARD_LIMIT = 8;

export function PipelinePage() {
  const { channels, projects } = useSnapshot();
  const { changeStage } = useData();
  const { notify } = useToast();
  const scopedIds = useScopedChannelIds();

  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage') as PipelineStage | null;
  const stageFilter = stageParam && PIPELINE_STAGES.includes(stageParam) ? stageParam : null;
  const [view, setView] = useState<ViewMode>(stageFilter ? 'table' : 'board');
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [format, setFormat] = useState<VideoFormat | 'all'>('all');
  const [language, setLanguage] = useState<LanguageCode | 'all'>('all');
  const [impediment, setImpediment] = useState<Impediment>('all');
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<PipelineStage | null>(null);
  const [newOpen, setNewOpenState] = useState(searchParams.get('new') === '1');
  function setNewOpen(open: boolean) {
    setNewOpenState(open);
    if (!open && searchParams.has('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }

  const scoped = useMemo(() => scopeProjects(projects, scopedIds), [projects, scopedIds]);

  const filtered = useMemo(
    () =>
      scoped.filter((project) => {
        if (stageFilter && project.stage !== stageFilter) return false;
        if (priority !== 'all' && project.priority !== priority) return false;
        if (format !== 'all' && project.format !== format) return false;
        if (language !== 'all' && !project.languages.includes(language)) return false;
        if (impediment === 'blocked' && !project.blocker) return false;
        if (impediment === 'failed' && !project.failure) return false;
        if (impediment === 'clear' && (project.blocker || project.failure)) return false;
        return matchesQuery(query, project.title, project.brief.summary, project.brief.hook);
      }),
    [scoped, stageFilter, priority, format, language, impediment, query],
  );

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, VideoProject[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage, []);
    for (const project of filtered) map.get(project.stage)!.push(project);
    for (const [stage, list] of map) {
      list.sort((a, b) =>
        stage === 'published'
          ? (b.publishing.publishedAt ?? '').localeCompare(a.publishing.publishedAt ?? '')
          : PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.dueDate.localeCompare(b.dueDate),
      );
    }
    return map;
  }, [filtered]);

  const blockedProjects = blocked(filtered);
  const failedProjects = failed(filtered);
  const filtersActive =
    stageFilter !== null ||
    query !== '' || priority !== 'all' || format !== 'all' || language !== 'all' || impediment !== 'all';

  async function moveTo(project: VideoProject, stage: PipelineStage) {
    if (project.stage === stage) return;
    try {
      await changeStage(project.id, stage);
      notify({
        tone: 'success',
        title: `Moved to ${STAGE_LABELS[stage]}`,
        description: 'Record updated locally. No media was generated and nothing was published.',
      });
    } catch (cause) {
      notify({
        tone: cause instanceof StageChangeError ? 'error' : 'error',
        title: cause instanceof StageChangeError ? 'Stage change blocked' : 'Could not change stage',
        description: cause instanceof Error ? cause.message : 'Unknown error.',
      });
    }
  }

  function clearFilters() {
    if (stageFilter) setSearchParams({}, { replace: true });
    setQuery('');
    setPriority('all');
    setFormat('all');
    setLanguage('all');
    setImpediment('all');
  }

  const tableRows = useMemo(
    () =>
      filtered.map((project) => ({
        project,
        id: project.id,
        title: project.title,
        channel: channels.find((item) => item.id === project.channelId)?.name ?? '',
        stage: project.stage,
        priorityWeight: PRIORITY_WEIGHT[project.priority],
        dueDate: project.dueDate,
        estimatedCost: project.estimatedCost,
        duration: project.targetDurationMinutes,
        updatedAt: project.updatedAt,
      })),
    [filtered, channels],
  );
  const { sorted, sortKey, direction, toggle } = useSortableTable(tableRows, 'updatedAt', 'desc');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Content Pipeline"
        description="Every video project and where it has got to. Blocked work and failed jobs are tracked separately from the stages."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border-strong bg-card p-0.5">
              <Button
                variant={view === 'board' ? 'soft' : 'ghost'}
                size="sm"
                onClick={() => setView('board')}
                aria-pressed={view === 'board'}
              >
                <KanbanSquare /> Board
              </Button>
              <Button
                variant={view === 'table' ? 'soft' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
              >
                <Rows3 /> Table
              </Button>
            </div>
            <Button variant="primary" size="md" onClick={() => setNewOpen(true)}>
              <Plus /> New video
            </Button>
          </div>
        }
      />

      <Notice>
        Changing a stage updates this record only. It does not run research, write a script, generate
        audio or visuals, or publish anything.
      </Notice>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title…"
            aria-label="Filter projects by title"
            className="pl-8"
          />
        </div>
        <NativeSelect
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority | 'all')}
          aria-label="Filter by priority"
          className="w-auto"
        >
          <option value="all">All priorities</option>
          {PRIORITY_VALUES.map((value) => (
            <option key={value} value={value}>
              {PRIORITY_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={format}
          onChange={(event) => setFormat(event.target.value as VideoFormat | 'all')}
          aria-label="Filter by format"
          className="w-auto"
        >
          <option value="all">All formats</option>
          {(Object.keys(VIDEO_FORMAT_LABELS) as VideoFormat[]).map((value) => (
            <option key={value} value={value}>
              {VIDEO_FORMAT_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode | 'all')}
          aria-label="Filter by language track"
          className="w-auto"
        >
          <option value="all">Both languages</option>
          <option value="en">{LANGUAGE_LABELS.en}</option>
          <option value="hi">{LANGUAGE_LABELS.hi}</option>
        </NativeSelect>
        <NativeSelect
          value={impediment}
          onChange={(event) => setImpediment(event.target.value as Impediment)}
          aria-label="Filter by impediment"
          className="w-auto"
        >
          <option value="all">Blocked and clear</option>
          <option value="blocked">Blocked only</option>
          <option value="failed">Failed jobs only</option>
          <option value="clear">No impediments</option>
        </NativeSelect>
        {stageFilter && <Badge tone="accent">Stage: {STAGE_LABELS[stageFilter]}</Badge>}
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X /> Clear
          </Button>
        )}
        <span className="text-2xs text-muted-foreground">
          {filtered.length} of {scoped.length} projects
        </span>
      </div>

      {(blockedProjects.length > 0 || failedProjects.length > 0) && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ImpedimentStrip
            tone="danger"
            icon={AlertTriangle}
            title={`Failed jobs (${failedProjects.length})`}
            description="Simulated job failures. These keep their stage — the work has not moved backwards."
            projects={failedProjects}
            render={(project) => project.failure!.message}
          />
          <ImpedimentStrip
            tone="warning"
            icon={CircleSlash}
            title={`Blocked (${blockedProjects.length})`}
            description="Work that cannot continue for a reason outside the pipeline stages."
            projects={blockedProjects}
            render={(project) =>
              `${BLOCKER_REASON_LABELS[project.blocker!.reason]} — ${project.blocker!.note}`
            }
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card-surface">
          {scoped.length === 0 ? (
            <EmptyState
              title="No videos yet"
              description="Create a video project, or promote an idea from a channel's backlog."
              action={{ label: 'New video', onClick: () => setNewOpen(true) }}
            />
          ) : (
            <EmptyState
              title="No projects match those filters"
              description="Widen the filters, or create a new video project."
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          )}
        </div>
      ) : view === 'board' ? (
        <div className="scrollbar-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {PIPELINE_STAGES.map((stage) => {
            const list = byStage.get(stage)!;
            const visible = stage === 'published' ? list.slice(0, PUBLISHED_CARD_LIMIT) : list;
            return (
              <section
                key={stage}
                aria-label={STAGE_LABELS[stage]}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(stage);
                }}
                onDragLeave={() => setDropTarget((current) => (current === stage ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropTarget(null);
                  const project = filtered.find((item) => item.id === dragged);
                  setDragged(null);
                  if (project) void moveTo(project, stage);
                }}
                className={cn(
                  'flex w-64 shrink-0 flex-col rounded-xl border bg-subtle/40 transition-colors',
                  dropTarget === stage ? 'border-primary bg-primary-soft/40' : 'border-border',
                )}
              >
                <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <InfoTip label={STAGE_DESCRIPTIONS[stage]}>
                    <h2 className="cursor-help truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {STAGE_LABELS[stage]}
                    </h2>
                  </InfoTip>
                  <span className="tabular rounded bg-card px-1.5 text-2xs font-medium text-muted-foreground">
                    {list.length}
                  </span>
                </header>

                <div className="flex-1 space-y-2 p-2">
                  {list.length === 0 ? (
                    <p className="px-1 py-6 text-center text-2xs text-muted-foreground">Nothing here</p>
                  ) : (
                    visible.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        dragging={dragged === project.id}
                        onDragStart={() => setDragged(project.id)}
                        onStageChange={(next) => void moveTo(project, next)}
                      />
                    ))
                  )}
                  {list.length > visible.length && (
                    <button
                      type="button"
                      onClick={() => setView('table')}
                      className="w-full rounded-lg border border-dashed border-border-strong py-2 text-2xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {list.length - visible.length} more — open the table view
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="card-surface">
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <SortableTh active={sortKey === 'title'} direction={direction} onSort={() => toggle('title')}>
                    Video
                  </SortableTh>
                  <SortableTh active={sortKey === 'channel'} direction={direction} onSort={() => toggle('channel')}>
                    Channel
                  </SortableTh>
                  <Th>Format</Th>
                  <Th>Languages</Th>
                  <SortableTh active={sortKey === 'duration'} direction={direction} onSort={() => toggle('duration')} className="text-right">
                    Target
                  </SortableTh>
                  <SortableTh active={sortKey === 'priorityWeight'} direction={direction} onSort={() => toggle('priorityWeight')}>
                    Priority
                  </SortableTh>
                  <SortableTh active={sortKey === 'dueDate'} direction={direction} onSort={() => toggle('dueDate')}>
                    Due
                  </SortableTh>
                  <SortableTh active={sortKey === 'estimatedCost'} direction={direction} onSort={() => toggle('estimatedCost')} className="text-right">
                    Est. cost
                  </SortableTh>
                  <Th>Stage</Th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const project = row.project;
                  const channel = channels.find((item) => item.id === project.channelId)!;
                  return (
                    <Tr key={row.id}>
                      <Td>
                        <Link to={`/pipeline/${project.id}`} className="font-medium hover:text-primary">
                          {project.title}
                        </Link>
                        {(project.blocker || project.failure) && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {project.failure && <Badge tone="danger">Failed job</Badge>}
                            {project.blocker && (
                              <Badge tone="warning">{BLOCKER_REASON_LABELS[project.blocker.reason]}</Badge>
                            )}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Link
                          to={`/channels/${channel.slug}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                        >
                          <ChannelAvatar channel={channel} size="sm" />
                          <span className="truncate">{channel.name}</span>
                        </Link>
                      </Td>
                      <Td className="text-muted-foreground">{VIDEO_FORMAT_LABELS[project.format]}</Td>
                      <Td>
                        <LanguagePips project={project} />
                      </Td>
                      <Td className="tabular text-right">{formatDuration(project.targetDurationMinutes)}</Td>
                      <Td>
                        <PriorityBadge priority={project.priority} />
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            'text-xs',
                            project.stage !== 'published' && isOverdue(project.dueDate)
                              ? 'font-medium text-danger'
                              : 'text-muted-foreground',
                          )}
                        >
                          {relativeToToday(project.dueDate)}
                        </span>
                      </Td>
                      <Td className="tabular text-right">{formatCompactInr(project.estimatedCost)}</Td>
                      <Td>
                        <NativeSelect
                          value={project.stage}
                          onChange={(event) => void moveTo(project, event.target.value as PipelineStage)}
                          aria-label={`Stage for ${project.title}`}
                          className="h-8 w-auto min-w-28 text-xs"
                        >
                          {PIPELINE_STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              {STAGE_LABELS[stage]}
                            </option>
                          ))}
                        </NativeSelect>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}

      <NewProjectDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function ImpedimentStrip({
  tone,
  icon: Icon,
  title,
  description,
  projects,
  render,
}: {
  tone: 'danger' | 'warning';
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  projects: VideoProject[];
  render: (project: VideoProject) => string;
}) {
  if (projects.length === 0) return null;
  return (
    <section className="card-surface">
      <div className="flex items-start gap-2 border-b border-border px-4 py-2.5">
        <Icon className={cn('mt-0.5 size-4 shrink-0', tone === 'danger' ? 'text-danger' : 'text-warning')} aria-hidden />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-2xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {projects.slice(0, 4).map((project) => (
          <li key={project.id}>
            <Link to={`/pipeline/${project.id}`} className="flex items-start gap-2 px-4 py-2 hover:bg-subtle/60">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{project.title}</span>
                <span className="block truncate text-2xs text-muted-foreground">{render(project)}</span>
              </span>
              <StageBadge stage={project.stage} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
