import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LanguageCode, NewProjectInput, PipelineStage, Priority, VideoFormat } from '@/types';
import {
  LANGUAGE_LABELS,
  PIPELINE_STAGES,
  PRIORITY_LABELS,
  PRIORITY_VALUES,
  STAGE_LABELS,
  VIDEO_FORMAT_LABELS,
} from '@/types';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  NativeSelect,
  Textarea,
  useToast,
} from '@/components/ui';
import { useData, useSnapshot } from '@/store/app-store';
import { addDays, today } from '@/lib/date';
import { formatCurrency } from '@/lib/format';

interface FormState {
  channelId: string;
  title: string;
  format: VideoFormat;
  languages: LanguageCode[];
  targetDurationMinutes: string;
  priority: Priority;
  dueDate: string;
  estimatedCost: string;
  stage: PipelineStage;
  hook: string;
  summary: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

/** Stages a project can legitimately be created at. */
const CREATABLE_STAGES: PipelineStage[] = ['idea', 'research', 'script'];

function initialState(channelId: string, languages: LanguageCode[] = ['en']): FormState {
  return {
    channelId,
    title: '',
    format: 'explainer',
    languages,
    targetDurationMinutes: '10',
    priority: 'normal',
    dueDate: addDays(today(), 14),
    estimatedCost: '0',
    stage: 'idea',
    hook: '',
    summary: '',
  };
}

export function NewProjectDialog({
  open,
  onOpenChange,
  defaultChannelId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultChannelId?: string;
}) {
  const { channels, settings } = useSnapshot();
  const { createProject } = useData();
  const { notify } = useToast();
  const navigate = useNavigate();

  const fallbackChannelId = defaultChannelId ?? channels[0]?.id ?? '';
  const channelLanguages = (id: string) => channels.find((item) => item.id === id)?.config.languages;
  const [form, setForm] = useState<FormState>(() =>
    initialState(fallbackChannelId, channelLanguages(fallbackChannelId)),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const channel = useMemo(
    () => channels.find((item) => item.id === form.channelId),
    [channels, form.channelId],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  /** Picking a channel pulls in its defaults, the way a real form would. */
  function selectChannel(channelId: string) {
    const next = channels.find((item) => item.id === channelId);
    setForm((current) => ({
      ...current,
      channelId,
      languages: next ? next.config.languages : current.languages,
      // Only pre-fill from settings the channel actually has.
      format: next?.config.preferredFormats[0] ?? current.format,
      targetDurationMinutes:
        next && next.config.targetDurationMinutes.max
          ? String(Math.round((next.config.targetDurationMinutes.min + next.config.targetDurationMinutes.max) / 2))
          : current.targetDurationMinutes,
      estimatedCost:
        next && next.config.monthlyBudget && next.config.cadence.videosPerWeek
          ? String(Math.round(next.config.monthlyBudget / (next.config.cadence.videosPerWeek * 4.33)))
          : current.estimatedCost,
    }));
    setErrors({});
  }

  function toggleLanguage(language: LanguageCode) {
    setForm((current) => ({
      ...current,
      languages: current.languages.includes(language)
        ? current.languages.filter((item) => item !== language)
        : [...current.languages, language],
    }));
    setErrors((current) => ({ ...current, languages: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.channelId) next.channelId = 'Pick a channel.';
    if (form.title.trim().length < 6) next.title = 'Give the video a title of at least six characters.';
    if (form.languages.length === 0) next.languages = 'Pick at least one language track.';

    const duration = Number(form.targetDurationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) next.targetDurationMinutes = 'Enter a duration in minutes.';
    else if (duration > 180) next.targetDurationMinutes = 'Keep the target under 180 minutes.';

    const cost = Number(form.estimatedCost);
    if (!Number.isFinite(cost) || cost < 0) next.estimatedCost = 'Enter an estimate of zero or more.';
    else if (cost > settings.perVideoBudgetCap) {
      next.estimatedCost = `Above the ${formatCurrency(settings.perVideoBudgetCap, settings.currency)} per-video cap set in Settings.`;
    }

    if (!form.dueDate) next.dueDate = 'Pick a due date.';
    else if (form.dueDate < today()) next.dueDate = 'The due date is in the past.';

    return next;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const input: NewProjectInput = {
        channelId: form.channelId,
        title: form.title.trim(),
        format: form.format,
        languages: form.languages,
        targetDurationMinutes: Number(form.targetDurationMinutes),
        priority: form.priority,
        dueDate: form.dueDate,
        estimatedCost: Number(form.estimatedCost),
        stage: form.stage,
        hook: form.hook.trim(),
        summary: form.summary.trim(),
      };
      const project = await createProject(input);
      notify({
        tone: 'success',
        title: 'Video project created',
        description: 'Saved locally. Nothing was sent to YouTube or any production service.',
      });
      onOpenChange(false);
      setForm(initialState(fallbackChannelId, channelLanguages(fallbackChannelId)));
      navigate(`/pipeline/${project.id}`);
    } catch (cause) {
      notify({
        tone: 'error',
        title: 'Could not create the project',
        description: cause instanceof Error ? cause.message : 'Unknown error.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>New video project</DialogTitle>
          <DialogDescription>
            Creates a project record in the pipeline. No research, script, audio or video is generated.
          </DialogDescription>
        </DialogHeader>

        {/*
          noValidate: this form validates itself and shows the message next to the
          field. Native validation would otherwise block submit without a word —
          e.g. a cost derived from the channel budget that is not a multiple of
          the input's step.
        */}
        <form onSubmit={submit} className="contents" noValidate>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Channel" required error={errors.channelId}>
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={form.channelId}
                    onChange={(event) => selectChannel(event.target.value)}
                  >
                    {channels.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>

              <Field label="Format" error={errors.format}>
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={form.format}
                    onChange={(event) => set('format', event.target.value as VideoFormat)}
                  >
                    {(channel?.config.preferredFormats.length
                      ? channel.config.preferredFormats
                      : (Object.keys(VIDEO_FORMAT_LABELS) as VideoFormat[])
                    ).map((format) => (
                      <option key={format} value={format}>
                        {VIDEO_FORMAT_LABELS[format]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </div>

            <Field label="Title" required error={errors.title} hint="Working title — it can change before publishing.">
              {(props) => (
                <Input
                  {...props}
                  value={form.title}
                  onChange={(event) => set('title', event.target.value)}
                  placeholder="What is this video about?"
                />
              )}
            </Field>

            <fieldset>
              <legend className="text-xs font-medium">
                Language tracks<span className="ml-0.5 text-danger">*</span>
              </legend>
              <p className="mt-0.5 text-2xs text-muted-foreground">
                Each track carries its own script, audio and captions readiness.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                {(['en', 'hi'] as LanguageCode[]).map((language) => (
                  <label key={language} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.languages.includes(language)}
                      onChange={() => toggleLanguage(language)}
                    />
                    {LANGUAGE_LABELS[language]}
                  </label>
                ))}
              </div>
              {errors.languages && <p className="mt-1 text-2xs text-danger">{errors.languages}</p>}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Target duration" required error={errors.targetDurationMinutes} hint="Minutes">
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={1}
                    max={180}
                    value={form.targetDurationMinutes}
                    onChange={(event) => set('targetDurationMinutes', event.target.value)}
                  />
                )}
              </Field>

              <Field label="Priority">
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={form.priority}
                    onChange={(event) => set('priority', event.target.value as Priority)}
                  >
                    {PRIORITY_VALUES.map((priority) => (
                      <option key={priority} value={priority}>
                        {PRIORITY_LABELS[priority]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>

              <Field label="Due date" required error={errors.dueDate}>
                {(props) => (
                  <Input
                    {...props}
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => set('dueDate', event.target.value)}
                  />
                )}
              </Field>

              <Field
                label="Estimated cost"
                required
                error={errors.estimatedCost}
                hint={`Cap: ${formatCurrency(settings.perVideoBudgetCap, settings.currency)}`}
              >
                {(props) => (
                  <Input
                    {...props}
                    type="number"
                    min={0}
                    step={500}
                    value={form.estimatedCost}
                    onChange={(event) => set('estimatedCost', event.target.value)}
                  />
                )}
              </Field>
            </div>

            <Field label="Starting stage" hint="New work normally starts as an idea.">
              {(props) => (
                <NativeSelect
                  {...props}
                  value={form.stage}
                  onChange={(event) => set('stage', event.target.value as PipelineStage)}
                >
                  {PIPELINE_STAGES.filter((stage) => CREATABLE_STAGES.includes(stage)).map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>

            <Field label="Hook" hint="The first line the viewer hears.">
              {(props) => (
                <Textarea
                  {...props}
                  rows={2}
                  value={form.hook}
                  onChange={(event) => set('hook', event.target.value)}
                />
              )}
            </Field>

            <Field label="Summary" hint="What the video covers, in a sentence or two.">
              {(props) => (
                <Textarea
                  {...props}
                  rows={3}
                  value={form.summary}
                  onChange={(event) => set('summary', event.target.value)}
                />
              )}
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
