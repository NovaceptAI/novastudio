import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useData, useSnapshot } from '@/store/app-store';
import {
  BLOCKER_REASON_LABELS,
  LANGUAGE_LABELS,
  PIPELINE_STAGES,
  PRIORITY_LABELS,
  PRIORITY_VALUES,
  REVIEW_DECISION_LABELS,
  REVIEW_DECISION_TONES,
  SOURCE_TYPE_LABELS,
  STAGE_LABELS,
  TRACK_STEP_STATUS_LABELS,
  TRACK_STEP_STATUS_TONES,
  VIDEO_FORMAT_LABELS,
  VISIBILITY_LABELS,
  type LanguageCode,
  type PipelineStage,
  type Priority,
  type ResearchRecord,
  type SourceType,
  type TrackStepStatus,
  type VideoFormat,
  type Visibility,
} from '@/types';
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  Input,
  NativeSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@/components/ui';
import {
  ChannelAvatar,
  DetailRow,
  FutureIntegration,
  PageHeader,
  PriorityBadge,
  Section,
  StageBadge,
} from '@/components/common';
import { StageChangeError } from '@/services/api';
import { ASSET_TYPE_LABELS, LICENCE_LABELS, LICENCE_TONES } from '@/types';
import { formatCurrency, formatDuration, formatFileSize, formatNumber } from '@/lib/format';
import { formatDateTime, formatFullDate, isOverdue, relativeToToday, today } from '@/lib/date';
import { createId } from '@/lib/utils';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, channels, assets } = useSnapshot();
  const { changeStage, updateProject, deleteProject } = useData();
  const { notify } = useToast();

  const project = projects.find((item) => item.id === projectId);
  const channel = channels.find((item) => item.id === project?.channelId);
  const projectAssets = useMemo(
    () => assets.filter((asset) => asset.projectId === projectId),
    [assets, projectId],
  );

  if (!project || !channel) {
    return (
      <div className="card-surface">
        <EmptyState
          title="Video project not found"
          description="It may have been deleted."
          action={{ label: 'Back to the pipeline', onClick: () => navigate('/pipeline') }}
        />
      </div>
    );
  }

  async function move(stage: PipelineStage) {
    try {
      await changeStage(project!.id, stage);
      notify({
        tone: 'success',
        title: `Moved to ${STAGE_LABELS[stage]}`,
        description: 'Local record only — nothing was generated or published.',
      });
    } catch (cause) {
      notify({
        tone: 'error',
        title: cause instanceof StageChangeError ? 'Stage change blocked' : 'Could not change stage',
        description: cause instanceof Error ? cause.message : 'Unknown error.',
      });
    }
  }

  async function remove() {
    await deleteProject(project!.id);
    notify({ tone: 'success', title: 'Project deleted', description: 'Removed from this local workspace.' });
    navigate('/pipeline');
  }

  const overdue = project.stage !== 'published' && isOverdue(project.dueDate);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/pipeline">
          <ArrowLeft /> Pipeline
        </Link>
      </Button>

      <PageHeader
        title={project.title}
        description={project.brief.summary}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              value={project.stage}
              onChange={(event) => void move(event.target.value as PipelineStage)}
              aria-label="Pipeline stage"
              className="w-auto"
            >
              {PIPELINE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </NativeSelect>
            <Button variant="ghost" size="icon" aria-label="Delete project" onClick={() => void remove()}>
              <Trash2 />
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/channels/${channel.slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ChannelAvatar channel={channel} size="sm" />
          {channel.name}
        </Link>
        <StageBadge stage={project.stage} />
        <PriorityBadge priority={project.priority} />
        <Badge tone="neutral">{VIDEO_FORMAT_LABELS[project.format]}</Badge>
        <Badge tone={overdue ? 'danger' : 'neutral'}>
          Due {relativeToToday(project.dueDate).toLowerCase()}
        </Badge>
        <Badge tone="neutral">{formatDuration(project.targetDurationMinutes)}</Badge>
        <Badge tone="neutral">{formatCurrency(project.estimatedCost)} est.</Badge>
      </div>

      {project.failure && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0 text-xs">
            <p className="font-medium text-danger">
              {project.failure.step} job failed after {project.failure.attempts} attempts
            </p>
            <p className="mt-0.5 leading-relaxed text-foreground/80">{project.failure.message}</p>
            <p className="mt-1 text-muted-foreground">
              {formatDateTime(project.failure.failedAt)} · the project keeps its stage, so the board still
              shows where the work actually is.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() =>
              void updateProject(project.id, { failure: null }, 'Failure cleared.').then(() =>
                notify({ tone: 'success', title: 'Failure cleared' }),
              )
            }
          >
            Clear
          </Button>
        </div>
      )}

      {project.blocker && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5">
          <CircleSlash className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 text-xs">
            <p className="font-medium text-warning">{BLOCKER_REASON_LABELS[project.blocker.reason]}</p>
            <p className="mt-0.5 leading-relaxed text-foreground/80">{project.blocker.note}</p>
            <p className="mt-1 text-muted-foreground">Blocked since {formatFullDate(project.blocker.since)}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() =>
              void updateProject(project.id, { blocker: null }, 'Blocker removed.').then(() =>
                notify({ tone: 'success', title: 'Blocker removed' }),
              )
            }
          >
            Unblock
          </Button>
        </div>
      )}

      <Tabs defaultValue="brief">
        <TabsList>
          <TabsTrigger value="brief">Brief</TabsTrigger>
          <TabsTrigger value="research">Research ({project.research.length})</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="media">Audio &amp; Visuals</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="pt-4">
          <BriefPanel projectId={project.id} />
        </TabsContent>

        <TabsContent value="research" className="pt-4">
          <ResearchPanel projectId={project.id} />
        </TabsContent>

        <TabsContent value="script" className="pt-4">
          <ScriptPanel projectId={project.id} />
        </TabsContent>

        <TabsContent value="media" className="space-y-4 pt-4">
          <MediaPanel projectId={project.id} />
          <Section title="Attached assets" description="Assets recorded against this video in the Asset Library.">
            {projectAssets.length === 0 ? (
              <EmptyState
                title="No assets yet"
                description="Assets appear once a project reaches the Script stage."
              />
            ) : (
              <ul className="divide-y divide-border">
                {projectAssets.map((asset) => (
                  <li key={asset.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{asset.name}</span>
                      <span className="block text-2xs text-muted-foreground">
                        {ASSET_TYPE_LABELS[asset.type]} · {asset.fileFormat.toUpperCase()} ·{' '}
                        {formatFileSize(asset.sizeKb)}
                      </span>
                    </span>
                    <Badge tone={LICENCE_TONES[asset.licence.type]}>
                      {LICENCE_LABELS[asset.licence.type]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="review" className="pt-4">
          <ReviewPanel projectId={project.id} />
        </TabsContent>

        <TabsContent value="publishing" className="pt-4">
          <PublishingPanel projectId={project.id} />
        </TabsContent>
      </Tabs>

      <Section title="Activity" description="What has happened to this project in this workspace.">
        <ol className="space-y-3">
          {project.activity.slice(0, 12).map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border-strong" />
              <div className="min-w-0">
                <p className="text-xs leading-relaxed">{entry.message}</p>
                <p className="text-2xs text-muted-foreground">
                  {entry.actor} · {formatDateTime(entry.at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- brief */

function useProject(projectId: string) {
  const { projects } = useSnapshot();
  return projects.find((item) => item.id === projectId)!;
}

function BriefPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { updateProject } = useData();
  const { notify } = useToast();
  const [draft, setDraft] = useState(() => ({
    title: project.title,
    format: project.format,
    priority: project.priority,
    dueDate: project.dueDate,
    targetDurationMinutes: String(project.targetDurationMinutes),
    estimatedCost: String(project.estimatedCost),
    hook: project.brief.hook,
    summary: project.brief.summary,
    angle: project.brief.angle,
    keywords: project.brief.keywords.join(', '),
    callToAction: project.brief.callToAction,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function save() {
    const next: Record<string, string> = {};
    if (draft.title.trim().length < 6) next.title = 'Title must be at least six characters.';
    if (Number(draft.targetDurationMinutes) <= 0) next.targetDurationMinutes = 'Enter a duration above zero.';
    if (Number(draft.estimatedCost) < 0) next.estimatedCost = 'Cost cannot be negative.';
    if (!draft.dueDate) next.dueDate = 'Pick a due date.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await updateProject(
        projectId,
        {
          title: draft.title.trim(),
          format: draft.format,
          priority: draft.priority,
          dueDate: draft.dueDate,
          targetDurationMinutes: Number(draft.targetDurationMinutes),
          estimatedCost: Number(draft.estimatedCost),
          brief: {
            ...project.brief,
            hook: draft.hook,
            summary: draft.summary,
            angle: draft.angle,
            keywords: draft.keywords
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean),
            callToAction: draft.callToAction,
          },
        },
        'Brief updated.',
      );
      notify({ tone: 'success', title: 'Brief saved', description: 'Stored locally in this browser.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Brief"
      description="What this video is, who it is for and how it will be framed."
      actions={
        <Button variant="primary" size="sm" onClick={() => void save()} disabled={saving}>
          <Save /> {saving ? 'Saving…' : 'Save brief'}
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required error={errors.title}>
          {(props) => (
            <Input {...props} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Format">
            {(props) => (
              <NativeSelect
                {...props}
                value={draft.format}
                onChange={(event) => setDraft({ ...draft, format: event.target.value as VideoFormat })}
              >
                {(Object.keys(VIDEO_FORMAT_LABELS) as VideoFormat[]).map((format) => (
                  <option key={format} value={format}>
                    {VIDEO_FORMAT_LABELS[format]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field label="Priority">
            {(props) => (
              <NativeSelect
                {...props}
                value={draft.priority}
                onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}
              >
                {PRIORITY_VALUES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field label="Due date" error={errors.dueDate}>
            {(props) => (
              <Input
                {...props}
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
              />
            )}
          </Field>
          <Field label="Target duration (min)" error={errors.targetDurationMinutes}>
            {(props) => (
              <Input
                {...props}
                type="number"
                min={1}
                value={draft.targetDurationMinutes}
                onChange={(event) => setDraft({ ...draft, targetDurationMinutes: event.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Hook" hint="The opening line.">
          {(props) => (
            <Textarea {...props} rows={2} value={draft.hook} onChange={(event) => setDraft({ ...draft, hook: event.target.value })} />
          )}
        </Field>
        <Field label="Summary">
          {(props) => (
            <Textarea {...props} rows={3} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
          )}
        </Field>
        <Field label="Angle" hint="How this is treated differently from the obvious version.">
          {(props) => (
            <Textarea {...props} rows={2} value={draft.angle} onChange={(event) => setDraft({ ...draft, angle: event.target.value })} />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keywords" hint="Comma separated.">
            {(props) => (
              <Input {...props} value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
            )}
          </Field>
          <Field label="Estimated cost" error={errors.estimatedCost}>
            {(props) => (
              <Input
                {...props}
                type="number"
                min={0}
                step={500}
                value={draft.estimatedCost}
                onChange={(event) => setDraft({ ...draft, estimatedCost: event.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Call to action">
          {(props) => (
            <Input {...props} value={draft.callToAction} onChange={(event) => setDraft({ ...draft, callToAction: event.target.value })} />
          )}
        </Field>

        <dl className="divide-y divide-border border-t border-border pt-2">
          <DetailRow label="Audience (from channel)">{project.brief.audience}</DetailRow>
          <DetailRow label="Language tracks">
            {project.languages.map((language) => LANGUAGE_LABELS[language]).join(' · ')}
          </DetailRow>
          <DetailRow label="Created">{formatDateTime(project.createdAt)}</DetailRow>
          <DetailRow label="Last updated">{formatDateTime(project.updatedAt)}</DetailRow>
        </dl>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------- research */

function ResearchPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { channels } = useSnapshot();
  const { updateProject } = useData();
  const { notify } = useToast();
  const channel = channels.find((item) => item.id === project.channelId)!;

  /**
   * Records are edited locally and saved in one go. Writing through the
   * service on every keystroke would put a round trip between the key press
   * and the character appearing.
   */
  const [draft, setDraft] = useState<ResearchRecord[]>(project.research);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(project.research);

  function update(id: string, patch: Partial<ResearchRecord>) {
    setDraft((current) => current.map((record) => (record.id === id ? { ...record, ...patch } : record)));
  }

  async function save(records: ResearchRecord[] = draft, message = 'Research updated.') {
    setSaving(true);
    try {
      await updateProject(projectId, { research: records }, message);
      notify({ tone: 'success', title: 'Research saved', description: 'Stored locally in this browser.' });
    } finally {
      setSaving(false);
    }
  }

  const unverified = draft.filter((record) => !record.verifiedOn).length;

  return (
    <Section
      title="Research"
      description="Every claim in the script should trace back to a source recorded here."
      actions={
        <div className="flex items-center gap-2">
          {dirty && <Badge tone="warning">Unsaved changes</Badge>}
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() =>
              setDraft((current) => [
                ...current,
                {
                  id: createId('res'),
                  title: 'New source',
                  sourceUrl: 'https://',
                  sourceName: '',
                  sourceType: 'article',
                  verifiedOn: null,
                  verifiedBy: null,
                  claimsSupported: [],
                  credibility: 'medium',
                  addedOn: today(),
                },
              ])
            }
          >
            <Plus /> Add source
          </Button>
          <Button variant="primary" size="sm" disabled={!dirty || saving} onClick={() => void save()}>
            <Save /> {saving ? 'Saving…' : 'Save research'}
          </Button>
        </div>
      }
    >
      {unverified > 0 && (
        <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-warning/30 bg-warning-soft px-2.5 py-2 text-2xs text-warning">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>
            {unverified} source{unverified > 1 ? 's have' : ' has'} no verification date. While source
            verification is required in Settings, this project cannot move to Scheduled.
          </span>
        </p>
      )}

      <div className="mb-3 rounded-lg border border-border bg-subtle/50 px-3 py-2 text-2xs text-muted-foreground">
        Approved domains for {channel.name}:{' '}
        {channel.config.approvedSources.map((source) => source.label).join(' · ')}
      </div>

      {draft.length === 0 ? (
        <EmptyState
          title="No sources recorded"
          description="Add the sources this video relies on before the script is written."
        />
      ) : (
        <ul className="space-y-3">
          {draft.map((record) => (
            <li key={record.id} className="rounded-lg border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="What it supports">
                  {(props) => (
                    <Input {...props} value={record.title} onChange={(event) => update(record.id, { title: event.target.value })} />
                  )}
                </Field>
                <Field label="Source name">
                  {(props) => (
                    <Input {...props} value={record.sourceName} onChange={(event) => update(record.id, { sourceName: event.target.value })} />
                  )}
                </Field>
                <Field label="Source URL" className="sm:col-span-2">
                  {(props) => (
                    <Input
                      {...props}
                      type="url"
                      value={record.sourceUrl}
                      onChange={(event) => update(record.id, { sourceUrl: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Source type">
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={record.sourceType}
                      onChange={(event) => update(record.id, { sourceType: event.target.value as SourceType })}
                    >
                      {(Object.keys(SOURCE_TYPE_LABELS) as SourceType[]).map((type) => (
                        <option key={type} value={type}>
                          {SOURCE_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <Field label="Verification date" hint="The day an editor checked this source says what we claim.">
                  {(props) => (
                    <Input
                      {...props}
                      type="date"
                      value={record.verifiedOn ?? ''}
                      onChange={(event) =>
                        update(record.id, {
                          verifiedOn: event.target.value || null,
                          verifiedBy: event.target.value ? (record.verifiedBy ?? 'You') : null,
                        })
                      }
                    />
                  )}
                </Field>
                <Field label="Claims supported" className="sm:col-span-2" hint="One claim per line.">
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={2}
                      value={record.claimsSupported.join('\n')}
                      onChange={(event) =>
                        update(record.id, {
                          claimsSupported: event.target.value.split('\n').filter((line) => line.trim()),
                        })
                      }
                    />
                  )}
                </Field>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
                {record.verifiedOn ? (
                  <Badge tone="success">
                    <ShieldCheck className="size-3" /> Verified {formatFullDate(record.verifiedOn)}
                    {record.verifiedBy ? ` by ${record.verifiedBy}` : ''}
                  </Badge>
                ) : (
                  <Badge tone="warning">Not verified</Badge>
                )}
                <Badge tone={record.credibility === 'high' ? 'success' : record.credibility === 'medium' ? 'info' : 'warning'}>
                  {record.credibility} credibility
                </Badge>
                {record.notes && <span className="text-2xs text-muted-foreground">{record.notes}</span>}
                <span className="ml-auto flex items-center gap-2">
                  {!record.verifiedOn && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const next = draft.map((item) =>
                          item.id === record.id
                            ? { ...item, verifiedOn: today(), verifiedBy: 'You' }
                            : item,
                        );
                        setDraft(next);
                        void save(next, `Source verified: ${record.title}`);
                      }}
                    >
                      Mark verified today
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <a href={record.sourceUrl} target="_blank" rel="noreferrer noopener">
                      Open <ExternalLink />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${record.title}`}
                    onClick={() => {
                      const next = draft.filter((item) => item.id !== record.id);
                      setDraft(next);
                      void save(next, 'Research record removed.');
                    }}
                  >
                    <Trash2 />
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ---------------------------------------------------------------- script */

function TrackStatusSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TrackStepStatus;
  onChange: (value: TrackStepStatus) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <NativeSelect
        value={value}
        onChange={(event) => onChange(event.target.value as TrackStepStatus)}
        className="h-8 w-auto text-xs"
        aria-label={label}
      >
        {(Object.keys(TRACK_STEP_STATUS_LABELS) as TrackStepStatus[]).map((status) => (
          <option key={status} value={status}>
            {TRACK_STEP_STATUS_LABELS[status]}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

function ScriptPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { updateProject } = useData();
  const { notify } = useToast();
  const [active, setActive] = useState<LanguageCode>(project.languages[0]);
  const track = project.tracks.find((item) => item.language === active) ?? project.tracks[0];
  const [body, setBody] = useState(track.scriptBody);
  const [saving, setSaving] = useState(false);

  function switchLanguage(language: LanguageCode) {
    setActive(language);
    const next = project.tracks.find((item) => item.language === language);
    setBody(next?.scriptBody ?? '');
  }

  async function saveTrack(patch: Partial<typeof track>) {
    setSaving(true);
    try {
      await updateProject(
        projectId,
        {
          tracks: project.tracks.map((item) =>
            item.language === active ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item,
          ),
        },
        `${LANGUAGE_LABELS[active]} track updated.`,
      );
    } finally {
      setSaving(false);
    }
  }

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <Section
      title="Script"
      description="Each language track is drafted and tracked independently."
      actions={
        <div className="flex items-center rounded-lg border border-border-strong bg-card p-0.5">
          {project.tracks.map((item) => (
            <Button
              key={item.language}
              variant={item.language === active ? 'soft' : 'ghost'}
              size="sm"
              onClick={() => switchLanguage(item.language)}
              aria-pressed={item.language === active}
            >
              {LANGUAGE_LABELS[item.language]}
              <Badge tone={TRACK_STEP_STATUS_TONES[item.script]}>
                {TRACK_STEP_STATUS_LABELS[item.script]}
              </Badge>
            </Button>
          ))}
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <TrackStatusSelect
            label="Script"
            value={track.script}
            onChange={(value) => void saveTrack({ script: value })}
          />
          <TrackStatusSelect
            label="Captions"
            value={track.captions}
            onChange={(value) => void saveTrack({ captions: value })}
          />
          <span className="tabular text-2xs text-muted-foreground">
            {formatNumber(wordCount)} words · about{' '}
            {formatDuration(wordCount / (active === 'hi' ? 132 : 148))} spoken
          </span>
        </div>

        <Textarea
          rows={16}
          aria-label={`${LANGUAGE_LABELS[active]} script`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="font-mono text-xs leading-relaxed"
          placeholder="Write the script here…"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-2xs text-muted-foreground">
            Last updated {formatDateTime(track.updatedAt)}
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled={saving || body === track.scriptBody}
            onClick={() =>
              void saveTrack({ scriptBody: body, scriptWordCount: wordCount }).then(() =>
                notify({ tone: 'success', title: `${LANGUAGE_LABELS[active]} script saved` }),
              )
            }
          >
            <Save /> {saving ? 'Saving…' : 'Save script'}
          </Button>
        </div>

        <FutureIntegration
          label="Script generation is a future integration"
          detail="Drafting assistance would run server-side against the channel brief and approved sources."
        />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------- audio & visuals */

function MediaPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { channels } = useSnapshot();
  const { updateProject } = useData();
  const channel = channels.find((item) => item.id === project.channelId)!;

  function setTrack(language: LanguageCode, patch: { audio?: TrackStepStatus }) {
    void updateProject(
      projectId,
      {
        tracks: project.tracks.map((track) =>
          track.language === language ? { ...track, ...patch, updatedAt: new Date().toISOString() } : track,
        ),
      },
      `${LANGUAGE_LABELS[language]} audio status updated.`,
    );
  }

  return (
    <Section title="Audio and visuals" description="Planning state per language. No media is produced here.">
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Voice tracks
          </h3>
          <ul className="mt-2 divide-y divide-border">
            {project.tracks.map((track) => (
              <li key={track.language} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-32 text-sm font-medium">{LANGUAGE_LABELS[track.language]}</span>
                <Badge tone={TRACK_STEP_STATUS_TONES[track.audio]}>
                  {TRACK_STEP_STATUS_LABELS[track.audio]}
                </Badge>
                <span className="text-2xs text-muted-foreground">
                  Voice slot:{' '}
                  {channel.voices.find((voice) => voice.language === track.language)?.name ?? 'Unassigned'}
                </span>
                <span className="ml-auto">
                  <TrackStatusSelect
                    label="Audio"
                    value={track.audio}
                    onChange={(value) => setTrack(track.language, { audio: value })}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="divide-y divide-border border-t border-border">
          <DetailRow label="Thumbnail style">{channel.branding.thumbnailStyle}</DetailRow>
          <DetailRow label="Lower thirds">{channel.branding.lowerThirdStyle}</DetailRow>
          <DetailRow label="Music direction">{channel.branding.musicDirection}</DetailRow>
        </dl>

        <div className="grid gap-2 sm:grid-cols-2">
          <FutureIntegration
            label="Voice rendering needs ElevenLabs"
            detail="Marking a track ready records a decision; it does not render audio."
          />
          <FutureIntegration
            label="Image and video generation are future integrations"
            detail="Visual assets are placeholder records until a provider is connected."
          />
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- review */

function ReviewPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { updateProject } = useData();
  const { notify } = useToast();
  const [notes, setNotes] = useState(project.review.notes);
  /**
   * The checklist is held locally as well as in the store: the service call is
   * asynchronous, and a checkbox that only ticks once the round trip finishes
   * feels broken and can be double-toggled by a fast click.
   */
  const [checklist, setChecklist] = useState(project.review.checklist);

  const requiredOutstanding = checklist.filter((item) => item.required && !item.checked).length;

  function toggleItem(id: string) {
    const next = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    setChecklist(next);
    void updateProject(
      projectId,
      { review: { ...project.review, checklist: next } },
      'Review checklist updated.',
    );
  }

  async function decide(decision: 'approved' | 'changes_requested') {
    if (decision === 'approved' && requiredOutstanding > 0) {
      notify({
        tone: 'error',
        title: 'Required checks are outstanding',
        description: `${requiredOutstanding} required item${requiredOutstanding > 1 ? 's' : ''} still unchecked.`,
      });
      return;
    }
    await updateProject(
      projectId,
      {
        review: {
          ...project.review,
          checklist,
          decision,
          reviewer: 'You',
          reviewedAt: new Date().toISOString(),
          notes,
        },
      },
      decision === 'approved' ? 'Review approved.' : 'Changes requested.',
    );
    notify({
      tone: 'success',
      title: decision === 'approved' ? 'Approved' : 'Changes requested',
      description:
        decision === 'approved'
          ? 'This project can now be moved to Scheduled.'
          : 'The reviewer notes have been recorded.',
    });
  }

  return (
    <Section
      title="Review"
      description="Editorial sign-off. Required items must be checked before approval."
      actions={
        <Badge tone={REVIEW_DECISION_TONES[project.review.decision]}>
          {REVIEW_DECISION_LABELS[project.review.decision]}
        </Badge>
      }
    >
      <div className="space-y-4">
        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={item.checked}
                  onChange={() => toggleItem(item.id)}
                />
                <span className="min-w-0 flex-1 leading-relaxed">
                  {item.label}
                  {item.required && <span className="ml-1.5 text-2xs text-danger">required</span>}
                </span>
                {item.checked && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />}
              </label>
            </li>
          ))}
        </ul>

        <Field label="Reviewer notes">
          {(props) => (
            <Textarea {...props} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          )}
        </Field>

        {project.review.reviewedAt && (
          <p className="text-2xs text-muted-foreground">
            Last reviewed by {project.review.reviewer} on {formatDateTime(project.review.reviewedAt)}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => void decide('approved')}>
            <CheckCircle2 /> Approve
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void decide('changes_requested')}>
            Request changes
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ publishing */

function PublishingPanel({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const { channels } = useSnapshot();
  const { updateProject, rescheduleProject } = useData();
  const { notify } = useToast();
  const channel = channels.find((item) => item.id === project.channelId)!;
  const [draft, setDraft] = useState({
    visibility: project.publishing.visibility,
    playlist: project.publishing.playlist,
    tags: project.publishing.tags.join(', '),
    madeForKids: project.publishing.madeForKids,
    date: (project.publishing.scheduledFor ?? '').slice(0, 10) || project.dueDate,
  });

  async function save() {
    await updateProject(
      projectId,
      {
        publishing: {
          ...project.publishing,
          visibility: draft.visibility,
          playlist: draft.playlist,
          madeForKids: draft.madeForKids,
          tags: draft.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      },
      'Publishing settings updated.',
    );
    if (draft.date !== (project.publishing.scheduledFor ?? '').slice(0, 10)) {
      await rescheduleProject(projectId, draft.date);
    }
    notify({ tone: 'success', title: 'Publishing settings saved', description: 'Local record only.' });
  }

  return (
    <div className="space-y-4">
      <Section
        title="Publishing"
        description="How this would go out once a YouTube channel is connected."
        actions={
          <Button variant="primary" size="sm" onClick={() => void save()}>
            <Save /> Save
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Visibility">
              {(props) => (
                <NativeSelect
                  {...props}
                  value={draft.visibility}
                  onChange={(event) => setDraft({ ...draft, visibility: event.target.value as Visibility })}
                >
                  {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((value) => (
                    <option key={value} value={value}>
                      {VISIBILITY_LABELS[value]}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Field label="Playlist">
              {(props) => (
                <Input {...props} value={draft.playlist} onChange={(event) => setDraft({ ...draft, playlist: event.target.value })} />
              )}
            </Field>
            <Field label="Publish date" hint={`Channel slot: ${channel.config.cadence.publishTime}`}>
              {(props) => (
                <Input
                  {...props}
                  type="date"
                  value={draft.date}
                  onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                />
              )}
            </Field>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
                <Checkbox
                  checked={draft.madeForKids}
                  onChange={(event) => setDraft({ ...draft, madeForKids: event.target.checked })}
                />
                Made for Kids
              </label>
            </div>
          </div>

          <Field label="Tags" hint="Comma separated.">
            {(props) => (
              <Input {...props} value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} />
            )}
          </Field>

          <div className="space-y-3 border-t border-border pt-3">
            {project.tracks.map((track) => (
              <div key={track.language} className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold">{LANGUAGE_LABELS[track.language]} listing</p>
                <dl className="mt-2 divide-y divide-border">
                  <DetailRow label="Title">{track.publishTitle || '—'}</DetailRow>
                  <DetailRow label="Description">
                    <span className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                      {track.publishDescription || '—'}
                    </span>
                  </DetailRow>
                </dl>
              </div>
            ))}
          </div>

          <dl className="divide-y divide-border border-t border-border pt-2">
            <DetailRow label="Scheduled slot">
              {project.publishing.scheduledFor ? formatDateTime(project.publishing.scheduledFor) : 'Not scheduled'}
            </DetailRow>
            <DetailRow label="Published at">
              {project.publishing.publishedAt ? formatDateTime(project.publishing.publishedAt) : 'Not published'}
            </DetailRow>
            <DetailRow label="YouTube video id">
              <span className="text-muted-foreground">None — no channel is connected</span>
            </DetailRow>
          </dl>
        </div>
      </Section>

      <FutureIntegration
        label="Uploading and publishing are future integrations"
        detail="Moving this project to Published records the decision in NovaStudio. It does not upload a file or make anything live on YouTube."
      />
    </div>
  );
}
