import { useState } from 'react';
import { AlertTriangle, Database, RotateCcw, Save, ShieldAlert } from 'lucide-react';
import { useData, useSnapshot } from '@/store/app-store';
import {
  LANGUAGE_LABELS,
  WEEKDAY_LABELS,
  WEEKDAY_VALUES,
  type CurrencyCode,
  type LanguageCode,
  type Weekday,
  type WorkspaceSettings,
} from '@/types';
import {
  Badge,
  Button,
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
  Switch,
  useToast,
} from '@/components/ui';
import { DemoDataNotice, PageHeader, Section } from '@/components/common';
import { formatCurrency } from '@/lib/format';
import { formatDateTime } from '@/lib/date';

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

export function SettingsPage() {
  const { settings, projects, assets, channels } = useSnapshot();
  const { updateSettings, resetDemo, savedAt } = useData();
  const { notify } = useToast();

  const [draft, setDraft] = useState<WorkspaceSettings>(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  function set<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  async function save() {
    const next: Record<string, string> = {};
    if (draft.workspaceName.trim().length < 2) next.workspaceName = 'Give the workspace a name.';
    if (draft.perVideoBudgetCap <= 0) next.perVideoBudgetCap = 'The cap must be above zero.';
    if (draft.monthlyBudgetWarnPct < 1 || draft.monthlyBudgetWarnPct > 100) {
      next.monthlyBudgetWarnPct = 'Enter a percentage between 1 and 100.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      notify({ tone: 'error', title: 'Fix the highlighted fields' });
      return;
    }

    setSaving(true);
    try {
      await updateSettings(draft);
      notify({
        tone: 'success',
        title: 'Settings saved',
        description: 'Stored in this browser only.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function doReset() {
    setResetting(true);
    try {
      await resetDemo();
      setResetOpen(false);
      notify({
        tone: 'success',
        title: 'Demo data reset',
        description: 'Every local edit has been discarded and the seeded workspace restored.',
      });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Workspace defaults and the rules the pipeline enforces."
        actions={
          <div className="flex items-center gap-2">
            {dirty && <Badge tone="warning">Unsaved changes</Badge>}
            <Button variant="secondary" size="sm" onClick={() => setDraft(settings)} disabled={!dirty || saving}>
              Discard
            </Button>
            <Button variant="primary" size="sm" onClick={() => void save()} disabled={!dirty || saving}>
              <Save /> {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        }
      />

      <DemoDataNotice>
        Settings are stored in this browser's localStorage. They are not sent anywhere, and no API keys or
        secrets are ever collected here.
      </DemoDataNotice>

      <Section title="Workspace defaults" description="Applied to new projects and to how figures are shown.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Workspace name" error={errors.workspaceName}>
            {(props) => (
              <Input
                {...props}
                value={draft.workspaceName}
                onChange={(event) => set('workspaceName', event.target.value)}
              />
            )}
          </Field>
          <Field label="Default language" hint="Pre-selected on new video projects.">
            {(props) => (
              <NativeSelect
                {...props}
                value={draft.defaultLanguage}
                onChange={(event) => set('defaultLanguage', event.target.value as LanguageCode)}
              >
                {(['en', 'hi'] as LanguageCode[]).map((language) => (
                  <option key={language} value={language}>
                    {LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field label="Timezone" hint="Publish slots are expressed in this zone.">
            {(props) => (
              <NativeSelect
                {...props}
                value={draft.timezone}
                onChange={(event) => set('timezone', event.target.value)}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field label="Currency">
            {(props) => (
              <NativeSelect
                {...props}
                value={draft.currency}
                onChange={(event) => set('currency', event.target.value as CurrencyCode)}
              >
                <option value="INR">Indian rupee (₹)</option>
                <option value="USD">US dollar ($)</option>
              </NativeSelect>
            )}
          </Field>
          <Field label="Week starts on">
            {(props) => (
              <NativeSelect
                {...props}
                value={draft.weekStartsOn}
                onChange={(event) => set('weekStartsOn', event.target.value as Weekday)}
              >
                {WEEKDAY_VALUES.map((day) => (
                  <option key={day} value={day}>
                    {WEEKDAY_LABELS[day]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field label="Default date range (days)">
            {(props) => (
              <NativeSelect
                {...props}
                value={String(draft.defaultDateRangeDays)}
                onChange={(event) => set('defaultDateRangeDays', Number(event.target.value))}
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </NativeSelect>
            )}
          </Field>
        </div>
      </Section>

      <Section
        title="Review requirements"
        description="These rules are enforced when a project is moved to Scheduled."
      >
        <div className="divide-y divide-border">
          <ToggleRow
            label="Require review sign-off before scheduling"
            description="A project cannot reach the Scheduled stage until its review is approved."
            checked={draft.requireReviewBeforeScheduling}
            onChange={(value) => set('requireReviewBeforeScheduling', value)}
          />
          <ToggleRow
            label="Require every source to carry a verification date"
            description="Blocks scheduling while any research record on the project is unverified."
            checked={draft.requireSourceVerification}
            onChange={(value) => set('requireSourceVerification', value)}
          />
          <ToggleRow
            label="Flag blocked work on the Overview"
            description="Blocked projects appear in the Needs attention list."
            checked={draft.notifyOnBlocked}
            onChange={(value) => set('notifyOnBlocked', value)}
          />
          <ToggleRow
            label="Flag failed jobs on the Overview"
            description="Failed pipeline jobs are surfaced at the top of Needs attention."
            checked={draft.notifyOnFailedJob}
            onChange={(value) => set('notifyOnFailedJob', value)}
          />
        </div>
      </Section>

      <Section title="Budget limits" description="Warnings only — nothing is hard-blocked on cost.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Per-video budget cap"
            error={errors.perVideoBudgetCap}
            hint={`Currently ${formatCurrency(draft.perVideoBudgetCap, draft.currency)}. New projects above this are rejected by the form.`}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                min={1000}
                step={1000}
                value={draft.perVideoBudgetCap}
                onChange={(event) => set('perVideoBudgetCap', Number(event.target.value))}
              />
            )}
          </Field>
          <Field
            label="Monthly budget warning threshold (%)"
            error={errors.monthlyBudgetWarnPct}
            hint="A channel is flagged when committed estimates pass this share of its monthly budget."
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                min={1}
                max={100}
                value={draft.monthlyBudgetWarnPct}
                onChange={(event) => set('monthlyBudgetWarnPct', Number(event.target.value))}
              />
            )}
          </Field>
        </div>
      </Section>

      <Section title="API keys and secrets" description="Deliberately absent from this frontend.">
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p className="text-xs leading-relaxed">
            NovaStudio does not collect API keys, tokens or passwords. Anything a browser holds can be read
            by anyone using that browser, so every credential belongs in a backend secret store. The
            Integrations page lists what each service will need once that backend exists.
          </p>
        </div>
      </Section>

      <Section
        title="Demo data"
        description="Local edits live in this browser's localStorage and nowhere else."
      >
        <dl className="divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-xs text-muted-foreground">Channels</dt>
            <dd className="tabular text-sm">{channels.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-xs text-muted-foreground">Video projects</dt>
            <dd className="tabular text-sm">{projects.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-xs text-muted-foreground">Assets</dt>
            <dd className="tabular text-sm">{assets.length}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-xs text-muted-foreground">Local edits last saved</dt>
            <dd className="text-sm">{savedAt ? formatDateTime(savedAt) : 'No local edits yet'}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            <RotateCcw /> Reset demo data
          </Button>
          <span className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Database className="size-3.5" aria-hidden />
            Restores the seeded workspace and discards every local edit.
          </span>
        </div>
      </Section>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo data?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <p className="text-xs leading-relaxed">
                Every project you created, every edit to a channel, script, review or schedule, and all
                settings changes will be discarded, and the seeded workspace restored.
              </p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void doReset()} disabled={resetting}>
              {resetting ? 'Resetting…' : 'Reset demo data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
