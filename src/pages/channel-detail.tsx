import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Lightbulb,
  Plus,
  Save,
  Trash2,
  Unlink,
} from 'lucide-react';
import { useData, useSnapshot } from '@/store/app-store';
import {
  AUDIENCE_RATING_LABELS,
  CHANNEL_STATUS_LABELS,
  LANGUAGE_LABELS,
  SOURCE_TYPE_LABELS,
  VIDEO_FORMAT_LABELS,
  VOICE_ROLE_LABELS,
  WEEKDAY_LABELS,
  WEEKDAY_VALUES,
  type ApprovedSource,
  type ChannelBranding,
  type ChannelStatus,
  type VoiceProfile,
  type VoiceRole,
  type ChannelConfig,
  type LanguageCode,
  type VideoFormat,
  type Weekday,
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
  LanguagePips,
  PageHeader,
  Section,
  StageBadge,
} from '@/components/common';
import { formatCompactInr, formatCurrency } from '@/lib/format';
import { addDays, formatFullDate, relativeToToday, today } from '@/lib/date';
import { createId } from '@/lib/utils';
import { committedSpend, inProduction, recentlyPublished, scopeProjects, upcomingReleases } from '@/lib/selectors';
import { missingSetup } from '@/data/channels';

export function ChannelDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { channels, projects, ideas, settings } = useSnapshot();
  const { updateChannel } = useData();
  const { notify } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';
  const channel = channels.find((item) => item.slug === slug);

  const channelProjects = useMemo(
    () => (channel ? scopeProjects(projects, [channel.id]) : []),
    [projects, channel],
  );

  if (!channel) {
    return (
      <div className="card-surface">
        <EmptyState
          title="Channel not found"
          description="That channel does not exist in this workspace."
          action={{ label: 'Back to channels', onClick: () => navigate('/channels') }}
        />
      </div>
    );
  }

  const channelIdeas = ideas.filter((idea) => idea.channelId === channel.id);
  const upcoming = upcomingReleases(channelProjects, 45);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/channels">
          <ArrowLeft /> All channels
        </Link>
      </Button>

      <PageHeader
        title={channel.name}
        actions={
          <div className="flex items-center gap-2">
            <NativeSelect
              aria-label="Channel status"
              value={channel.status}
              className="h-8 w-auto text-xs"
              onChange={(event) =>
                void updateChannel(channel.id, { status: event.target.value as ChannelStatus }).then(() =>
                  notify({ tone: 'success', title: `Status set to ${CHANNEL_STATUS_LABELS[event.target.value as ChannelStatus]}` }),
                )
              }
            >
              {(Object.keys(CHANNEL_STATUS_LABELS) as ChannelStatus[]).map((value) => (
                <option key={value} value={value}>
                  {CHANNEL_STATUS_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
            {channel.audienceRating !== 'general' && (
              <Badge tone={channel.audienceRating === 'mature' ? 'danger' : 'accent'}>
                {AUDIENCE_RATING_LABELS[channel.audienceRating]}
              </Badge>
            )}
          </div>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ideas">Ideas &amp; schedule</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="brand">Branding &amp; voices</TabsTrigger>
          <TabsTrigger value="connection">YouTube connection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <SetupChecklist
            missing={missingSetup(channel)}
            onOpen={() => setSearchParams({ tab: 'config' }, { replace: true })}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Section
              title="Recent videos"
              description="Most recently published on this channel."
            >
              {recentlyPublished(channelProjects, 6).length === 0 ? (
                <EmptyState title="Nothing published yet" description="Published videos will appear here." />
              ) : (
                <ul className="divide-y divide-border">
                  {recentlyPublished(channelProjects, 6).map((project) => (
                    <li key={project.id}>
                      <Link
                        to={`/pipeline/${project.id}`}
                        className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{project.title}</span>
                          <span className="block text-2xs text-muted-foreground">
                            {formatFullDate(project.publishing.publishedAt!.slice(0, 10))} ·{' '}
                            {VIDEO_FORMAT_LABELS[project.format]}
                          </span>
                        </span>
                        <LanguagePips project={project} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Production queue" description="Everything not yet published.">
              <div className="grid grid-cols-3 gap-2 pb-3 text-center">
                <div>
                  <p className="text-2xs text-muted-foreground">In production</p>
                  <p className="tabular text-lg font-semibold">{inProduction(channelProjects).length}</p>
                </div>
                <div>
                  <p className="text-2xs text-muted-foreground">Committed</p>
                  <p className="tabular text-lg font-semibold">
                    {formatCompactInr(committedSpend(channelProjects))}
                  </p>
                </div>
                <div>
                  <p className="text-2xs text-muted-foreground">Budget</p>
                  <p className="tabular text-lg font-semibold">
                    {formatCompactInr(channel.config.monthlyBudget)}
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-border border-t border-border">
                {channelProjects
                  .filter((project) => project.stage !== 'published')
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 6)
                  .map((project) => (
                    <li key={project.id}>
                      <Link
                        to={`/pipeline/${project.id}`}
                        className="flex items-center gap-3 py-2.5 transition-colors hover:text-primary"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{project.title}</span>
                          <span className="block text-2xs text-muted-foreground">
                            Due {relativeToToday(project.dueDate).toLowerCase()}
                          </span>
                        </span>
                        <StageBadge stage={project.stage} />
                      </Link>
                    </li>
                  ))}
              </ul>
            </Section>
          </div>

          <Section title="Editorial rules" description="Applied to every video on this channel.">
            <ul className="space-y-1.5">
              {channel.config.editorialRules.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </Section>
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4 pt-4">
          <IdeasPanel channelId={channel.id} ideas={channelIdeas} />

          <Section
            title="Upcoming schedule"
            description="Projects on this channel holding a publish slot."
          >
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No slots held"
                description="Move a project to Scheduled to reserve a publish slot."
              />
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map(({ project, slot }) => (
                  <li key={project.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <Link to={`/pipeline/${project.id}`} className="block truncate text-sm font-medium hover:text-primary">
                        {project.title}
                      </Link>
                      <span className="block text-2xs text-muted-foreground">
                        {formatFullDate(slot.slice(0, 10))} at {channel.config.cadence.publishTime}
                      </span>
                    </span>
                    <Badge tone="info">{relativeToToday(slot.slice(0, 10))}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="config" className="pt-4">
          <ConfigPanel channelId={channel.id} config={channel.config} perVideoCap={settings.perVideoBudgetCap} />
        </TabsContent>

        <TabsContent value="brand" className="space-y-4 pt-4">
          <BrandingPanel key={channel.id} channelId={channel.id} />
        </TabsContent>

        <TabsContent value="connection" className="space-y-4 pt-4">
          <Section
            title="Internal configuration vs. a connected channel"
            description="These are two different things, and only one of them exists right now."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-subtle/40 p-4">
                <p className="text-sm font-semibold">Internal channel configuration</p>
                <Badge tone="success" className="mt-2">
                  Configured in NovaStudio
                </Badge>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Audience, tone, languages, formats, cadence, budget, approved sources, editorial rules,
                  branding and voice slots. All of it is stored locally in this workspace and is what the
                  production pipeline reads.
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-border-strong p-4">
                <p className="text-sm font-semibold">Connected YouTube channel</p>
                <Badge tone="danger" className="mt-2">
                  <Unlink className="size-3" /> Not connected
                </Badge>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  No OAuth grant exists, so NovaStudio cannot upload, schedule, or read analytics from
                  YouTube.
                </p>
                <dl className="mt-3 divide-y divide-border border-t border-border">
                  <DetailRow label="Intended handle">
                    <HandleField
                      key={channel.youtube.intendedHandle}
                      value={channel.youtube.intendedHandle}
                      onSave={async (intendedHandle) => {
                        await updateChannel(channel.id, { youtube: { ...channel.youtube, intendedHandle } });
                        notify({ tone: 'success', title: 'Handle saved' });
                      }}
                    />
                  </DetailRow>
                  <DetailRow label="Last checked">Never</DetailRow>
                </dl>
              </div>
            </div>
            <FutureIntegration
              className="mt-4"
              label="Linking a real channel is a future integration"
              detail="It needs a Google Cloud project, an OAuth consent screen and a server-side token store."
            />
            <Button variant="ghost" size="sm" className="mt-3" asChild>
              <Link to="/integrations">
                Integration requirements <ExternalLink />
              </Link>
            </Button>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------------------------------------------- ideas */

function IdeasPanel({ channelId, ideas }: { channelId: string; ideas: ReturnType<typeof useSnapshot>['ideas'] }) {
  const { promoteIdea, addIdea } = useData();
  const { notify } = useToast();
  const [title, setTitle] = useState('');
  const [angle, setAngle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 6) {
      setError('Give the idea a title of at least six characters.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await addIdea({
        channelId,
        title: title.trim(),
        angle: angle.trim() || 'No angle recorded yet.',
        format: 'explainer',
        languages: ['en'],
        confidence: 3,
      });
      setTitle('');
      setAngle('');
      notify({ tone: 'success', title: 'Idea added to the backlog' });
    } finally {
      setBusy(false);
    }
  }

  async function promote(ideaId: string) {
    try {
      const project = await promoteIdea(ideaId, addDays(today(), 21));
      notify({
        tone: 'success',
        title: 'Idea promoted to a project',
        description: `${project.title} is now at the Idea stage in the pipeline.`,
      });
    } catch (cause) {
      notify({
        tone: 'error',
        title: 'Could not promote that idea',
        description: cause instanceof Error ? cause.message : 'Unknown error.',
      });
    }
  }

  return (
    <Section
      title="Content ideas"
      description="Backlog for this channel. Promoting an idea creates a project at the Idea stage."
    >
      {ideas.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No ideas in the backlog" description="Add one below." />
      ) : (
        <ul className="divide-y divide-border">
          {ideas.map((idea) => (
            <li key={idea.id} className="flex flex-wrap items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{idea.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{idea.angle}</p>
                <p className="mt-1 text-2xs text-muted-foreground">
                  Added {formatFullDate(idea.createdOn)}
                  {idea.source ? ` · ${idea.source}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{VIDEO_FORMAT_LABELS[idea.format]}</Badge>
                <Badge tone="accent">Confidence {idea.confidence}/5</Badge>
                <Button variant="secondary" size="sm" onClick={() => void promote(idea.id)}>
                  Promote
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="New idea" error={error ?? undefined}>
            {(props) => (
              <Input
                {...props}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Working title"
              />
            )}
          </Field>
          <Field label="Angle" hint="What makes this worth producing?">
            {(props) => (
              <Input {...props} value={angle} onChange={(event) => setAngle(event.target.value)} />
            )}
          </Field>
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={busy}>
          <Plus /> Add idea
        </Button>
      </form>
    </Section>
  );
}

/* --------------------------------------------------------- configuration */

function ConfigPanel({
  channelId,
  config,
  perVideoCap,
}: {
  channelId: string;
  config: ChannelConfig;
  perVideoCap: number;
}) {
  const { updateChannelConfig } = useData();
  const { notify } = useToast();
  const [draft, setDraft] = useState<ChannelConfig>(config);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(config);

  function set<K extends keyof ChannelConfig>(key: K, value: ChannelConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function toggleLanguage(language: LanguageCode) {
    const languages = draft.languages.includes(language)
      ? draft.languages.filter((item) => item !== language)
      : [...draft.languages, language];
    setDraft((current) => ({
      ...current,
      languages,
      primaryLanguage: languages.includes(current.primaryLanguage)
        ? current.primaryLanguage
        : (languages[0] ?? current.primaryLanguage),
    }));
  }

  function toggleFormat(format: VideoFormat) {
    set(
      'preferredFormats',
      draft.preferredFormats.includes(format)
        ? draft.preferredFormats.filter((item) => item !== format)
        : [...draft.preferredFormats, format],
    );
  }

  function toggleDay(day: Weekday) {
    const publishDays = draft.cadence.publishDays.includes(day)
      ? draft.cadence.publishDays.filter((item) => item !== day)
      : [...draft.cadence.publishDays, day];
    set('cadence', {
      ...draft.cadence,
      publishDays: WEEKDAY_VALUES.filter((value) => publishDays.includes(value)),
    });
  }

  function updateSource(id: string, patch: Partial<ApprovedSource>) {
    set(
      'approvedSources',
      draft.approvedSources.map((source) => (source.id === id ? { ...source, ...patch } : source)),
    );
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (draft.languages.length === 0) next.languages = 'Keep at least one language track.';
    const { min, max } = draft.targetDurationMinutes;
    // 0 / 0 means "not decided yet"; anything else has to be a real range.
    if ((min !== 0 || max !== 0) && (min <= 0 || min > max)) {
      next.targetDurationMinutes = 'Enter a minimum above zero and no larger than the maximum.';
    }
    if (draft.cadence.videosPerWeek < 0 || draft.cadence.videosPerWeek > 21) {
      next.cadence = 'Videos per week must be between 0 and 21.';
    } else if (draft.cadence.videosPerWeek > 0 && draft.cadence.publishDays.length === 0) {
      next.cadence = 'Pick at least one publishing day.';
    }
    if (draft.monthlyBudget < 0) next.monthlyBudget = 'Budget cannot be negative.';
    for (const source of draft.approvedSources) {
      if (!/^https?:\/\//.test(source.url)) {
        next.approvedSources = 'Every approved source needs a URL starting with http:// or https://';
        break;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) {
      notify({ tone: 'error', title: 'Fix the highlighted fields before saving' });
      return;
    }
    setSaving(true);
    try {
      await updateChannelConfig(channelId, draft);
      notify({
        tone: 'success',
        title: 'Channel configuration saved',
        description: 'Saved in this browser.',
      });
    } catch (cause) {
      notify({
        tone: 'error',
        title: 'Could not save',
        description: cause instanceof Error ? cause.message : 'Unknown error.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Section
        title="Editorial configuration"
        description="What this channel is for, and the constraints every video inherits."
        actions={
          <div className="flex items-center gap-2">
            {dirty && <Badge tone="warning">Unsaved changes</Badge>}
            <Button variant="secondary" size="sm" onClick={() => setDraft(config)} disabled={!dirty || saving}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={() => void save()} disabled={!dirty || saving}>
              <Save /> {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Audience" hint="Who this channel is made for.">
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={draft.audience}
                onChange={(event) => set('audience', event.target.value)}
              />
            )}
          </Field>

          <Field label="Tone" hint="How the channel speaks.">
            {(props) => (
              <Textarea
                {...props}
                rows={2}
                value={draft.tone}
                onChange={(event) => set('tone', event.target.value)}
              />
            )}
          </Field>

          <fieldset>
            <legend className="text-xs font-medium">Language tracks</legend>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {(['en', 'hi'] as LanguageCode[]).map((language) => (
                <label key={language} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.languages.includes(language)}
                    onChange={() => toggleLanguage(language)}
                  />
                  {LANGUAGE_LABELS[language]}
                </label>
              ))}
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Primary
                <NativeSelect
                  value={draft.primaryLanguage}
                  onChange={(event) => set('primaryLanguage', event.target.value as LanguageCode)}
                  className="h-8 w-auto"
                  aria-label="Primary language"
                >
                  {draft.languages.map((language) => (
                    <option key={language} value={language}>
                      {LANGUAGE_LABELS[language]}
                    </option>
                  ))}
                </NativeSelect>
              </label>
            </div>
            {errors.languages && <p className="mt-1 text-2xs text-danger">{errors.languages}</p>}
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium">Preferred formats</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(VIDEO_FORMAT_LABELS) as VideoFormat[]).map((format) => {
                const active = draft.preferredFormats.includes(format);
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleFormat(format)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'rounded-md border border-primary/30 bg-primary-soft px-2 py-1 text-xs font-medium text-primary-soft-foreground'
                        : 'rounded-md border border-border-strong px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
                    }
                  >
                    {VIDEO_FORMAT_LABELS[format]}
                  </button>
                );
              })}
            </div>
            {errors.preferredFormats && (
              <p className="mt-1 text-2xs text-danger">{errors.preferredFormats}</p>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Target duration (min)" error={errors.targetDurationMinutes}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  value={draft.targetDurationMinutes.min}
                  onChange={(event) =>
                    set('targetDurationMinutes', {
                      ...draft.targetDurationMinutes,
                      min: Number(event.target.value),
                    })
                  }
                />
              )}
            </Field>
            <Field label="Target duration (max)">
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  value={draft.targetDurationMinutes.max}
                  onChange={(event) =>
                    set('targetDurationMinutes', {
                      ...draft.targetDurationMinutes,
                      max: Number(event.target.value),
                    })
                  }
                />
              )}
            </Field>
            <Field label="Videos per week" error={errors.cadence}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  max={21}
                  value={draft.cadence.videosPerWeek}
                  onChange={(event) =>
                    set('cadence', { ...draft.cadence, videosPerWeek: Number(event.target.value) })
                  }
                />
              )}
            </Field>
            <Field
              label="Monthly budget"
              error={errors.monthlyBudget}
              hint={`Per-video cap: ${formatCurrency(perVideoCap)}`}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  step={1000}
                  value={draft.monthlyBudget}
                  onChange={(event) => set('monthlyBudget', Number(event.target.value))}
                />
              )}
            </Field>
          </div>

          <fieldset>
            <legend className="text-xs font-medium">Publishing days</legend>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {WEEKDAY_VALUES.map((day) => {
                const active = draft.cadence.publishDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'rounded-md border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-soft-foreground'
                        : 'rounded-md border border-border-strong px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
                    }
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                );
              })}
              <label className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
                Publish time
                <Input
                  type="time"
                  value={draft.cadence.publishTime}
                  onChange={(event) => set('cadence', { ...draft.cadence, publishTime: event.target.value })}
                  className="h-8 w-28"
                  aria-label="Publish time"
                />
              </label>
            </div>
          </fieldset>
        </div>
      </Section>

      <Section
        title="Approved research sources"
        description="Only these domains may be cited by a video on this channel."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              set('approvedSources', [
                ...draft.approvedSources,
                {
                  id: createId('src'),
                  label: 'New source',
                  url: 'https://',
                  type: 'article',
                  credibility: 'medium',
                  addedOn: today(),
                },
              ])
            }
          >
            <Plus /> Add source
          </Button>
        }
      >
        {errors.approvedSources && (
          <p className="mb-2 text-2xs text-danger">{errors.approvedSources}</p>
        )}
        {draft.approvedSources.length === 0 ? (
          <EmptyState title="No approved sources" description="Add at least one before research begins." />
        ) : (
          <ul className="space-y-3">
            {draft.approvedSources.map((source) => (
              <li key={source.id} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Label">
                  {(props) => (
                    <Input
                      {...props}
                      value={source.label}
                      onChange={(event) => updateSource(source.id, { label: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="URL">
                  {(props) => (
                    <Input
                      {...props}
                      type="url"
                      value={source.url}
                      onChange={(event) => updateSource(source.id, { url: event.target.value })}
                    />
                  )}
                </Field>
                <div className="flex items-end gap-2">
                  <NativeSelect
                    value={source.credibility}
                    onChange={(event) =>
                      updateSource(source.id, {
                        credibility: event.target.value as ApprovedSource['credibility'],
                      })
                    }
                    aria-label={`Credibility for ${source.label}`}
                    className="h-9 w-auto"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </NativeSelect>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${source.label}`}
                    onClick={() =>
                      set(
                        'approvedSources',
                        draft.approvedSources.filter((item) => item.id !== source.id),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <p className="text-2xs text-muted-foreground sm:col-span-3">
                  {SOURCE_TYPE_LABELS[source.type]} · added {formatFullDate(source.addedOn)}
                  {source.notes ? ` · ${source.notes}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Editorial rules" description="One rule per line.">
        <Textarea
          rows={6}
          aria-label="Editorial rules"
          value={draft.editorialRules.join('\n')}
          onChange={(event) =>
            set(
              'editorialRules',
              event.target.value.split('\n').filter((line) => line.trim().length > 0),
            )
          }
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setDraft(config)} disabled={!dirty || saving}>
            Discard
          </Button>
          <Button variant="primary" size="sm" onClick={() => void save()} disabled={!dirty || saving}>
            <Save /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------- setup */

const SETUP_LABELS = [
  'audience',
  'tone',
  'formats',
  'target duration',
  'cadence',
  'budget',
  'approved sources',
];

function SetupChecklist({ missing, onOpen }: { missing: string[]; onOpen: () => void }) {
  const done = SETUP_LABELS.length - missing.length;
  return (
    <Section
      title="Channel setup"
      description={
        missing.length === 0
          ? 'Everything the pipeline needs is set.'
          : `${done} of ${SETUP_LABELS.length} set. Finish these before producing for this channel.`
      }
      actions={
        missing.length > 0 && (
          <Button variant="primary" size="sm" onClick={onOpen}>
            Open configuration
          </Button>
        )
      }
    >
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {SETUP_LABELS.map((label) => {
          const ok = !missing.includes(label);
          return (
            <li key={label} className="flex items-center gap-2 text-sm">
              {ok ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 text-border-strong" aria-hidden />
              )}
              <span className={ok ? '' : 'text-muted-foreground'}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
              <span className="sr-only">{ok ? 'set' : 'not set'}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function HandleField({ value, onSave }: { value: string; onSave: (value: string) => Promise<void> }) {
  const [draft, setDraft] = useState(value);
  const clean = draft.trim();
  const valid = clean === '' || /^@[A-Za-z0-9._-]{3,30}$/.test(clean);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        aria-label="Intended YouTube handle"
        placeholder="@handle"
        value={draft}
        aria-invalid={!valid || undefined}
        onChange={(event) => setDraft(event.target.value)}
        className="h-8 w-56"
      />
      <Button size="sm" variant="secondary" disabled={!valid || clean === value} onClick={() => void onSave(clean)}>
        Save
      </Button>
      {!valid && <span className="text-2xs text-danger">Starts with @, 3–30 letters, digits, . _ or -</span>}
    </div>
  );
}

/* ------------------------------------------------------ branding & voices */

const BRANDING_FIELDS: { key: keyof ChannelBranding; label: string; hint: string }[] = [
  { key: 'thumbnailStyle', label: 'Thumbnail style', hint: 'Composition, text treatment, colour.' },
  { key: 'titleTypography', label: 'Title typography', hint: 'Typeface, weight, casing.' },
  { key: 'lowerThirdStyle', label: 'Lower thirds', hint: 'On-screen labels and captions.' },
  { key: 'musicDirection', label: 'Music direction', hint: 'Mood, instruments, how it sits under speech.' },
];

function BrandingPanel({ channelId }: { channelId: string }) {
  const { channels } = useSnapshot();
  const { updateChannel } = useData();
  const { notify } = useToast();
  const channel = channels.find((item) => item.id === channelId)!;
  const [branding, setBranding] = useState(channel.branding);
  const [voices, setVoices] = useState<VoiceProfile[]>(channel.voices);
  const [saving, setSaving] = useState(false);

  const dirty =
    JSON.stringify(branding) !== JSON.stringify(channel.branding) ||
    JSON.stringify(voices) !== JSON.stringify(channel.voices);
  const invalidVoice = voices.some((voice) => !voice.name.trim());

  function updateVoice(id: string, patch: Partial<VoiceProfile>) {
    setVoices((current) => current.map((voice) => (voice.id === id ? { ...voice, ...patch } : voice)));
  }

  async function save() {
    setSaving(true);
    try {
      await updateChannel(channelId, { branding, voices });
      notify({ tone: 'success', title: 'Branding and voices saved' });
    } finally {
      setSaving(false);
    }
  }

  const saveBar = (
    <div className="flex items-center gap-2">
      {dirty && <Badge tone="warning">Unsaved changes</Badge>}
      <Button
        variant="primary"
        size="sm"
        disabled={!dirty || saving || invalidVoice}
        onClick={() => void save()}
      >
        <Save /> {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );

  return (
    <>
      <Section title="Branding" description="Direction notes for thumbnails, titles and sound." actions={saveBar}>
        <div className="mb-4 flex items-center gap-3">
          <ChannelAvatar channel={channel} size="lg" />
          <p className="text-xs text-muted-foreground">
            The monogram and colour identify this channel across NovaStudio.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {BRANDING_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint}>
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  value={branding[field.key]}
                  onChange={(event) => setBranding({ ...branding, [field.key]: event.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        <FutureIntegration
          className="mt-4"
          label="Logo and template uploads are a future integration"
          detail="Brand files will live in object storage once AWS is connected."
        />
      </Section>

      <Section
        title="Narrator and character voices"
        description="Voice slots are configuration only — no provider voice is assigned."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setVoices((current) => [
                ...current,
                {
                  id: createId('vp'),
                  name: '',
                  role: 'narrator',
                  language: channel.config.primaryLanguage,
                  characteristics: '',
                  provider: 'unassigned',
                  providerVoiceId: null,
                  status: 'placeholder',
                },
              ])
            }
          >
            <Plus /> Add voice
          </Button>
        }
      >
        {voices.length === 0 ? (
          <EmptyState title="No voices yet" description="Add a narrator, host or character slot." />
        ) : (
          <ul className="space-y-3">
            {voices.map((voice) => (
              <li key={voice.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_9rem_8rem_auto]">
                <Field label="Name" required error={!voice.name.trim() ? 'Give the voice a name.' : undefined}>
                  {(props) => (
                    <Input {...props} value={voice.name} onChange={(event) => updateVoice(voice.id, { name: event.target.value })} />
                  )}
                </Field>
                <Field label="Role">
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={voice.role}
                      onChange={(event) => updateVoice(voice.id, { role: event.target.value as VoiceRole })}
                    >
                      {(Object.keys(VOICE_ROLE_LABELS) as VoiceRole[]).map((role) => (
                        <option key={role} value={role}>
                          {VOICE_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <Field label="Language">
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={voice.language}
                      onChange={(event) => updateVoice(voice.id, { language: event.target.value as LanguageCode })}
                    >
                      {(['en', 'hi'] as LanguageCode[]).map((language) => (
                        <option key={language} value={language}>
                          {LANGUAGE_LABELS[language]}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${voice.name || 'voice'}`}
                    onClick={() => setVoices((current) => current.filter((item) => item.id !== voice.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Field label="Delivery" hint="How it should sound." className="sm:col-span-4">
                  {(props) => (
                    <Input
                      {...props}
                      value={voice.characteristics}
                      onChange={(event) => updateVoice(voice.id, { characteristics: event.target.value })}
                    />
                  )}
                </Field>
              </li>
            ))}
          </ul>
        )}
        <FutureIntegration
          className="mt-4"
          label="Voice assignment needs ElevenLabs"
          detail="Each slot will map to a provider voice id once the integration exists."
        />
      </Section>
    </>
  );
}
