import { Cloud, ExternalLink, Image, Mic, Plug, Video, Youtube } from 'lucide-react';
import { useSnapshot } from '@/store/app-store';
import { INTEGRATION_CATEGORY_LABELS, type Integration } from '@/types';
import { Badge, Button } from '@/components/ui';
import { PageHeader, Section } from '@/components/common';

const ICONS: Record<string, typeof Plug> = {
  int_youtube: Youtube,
  int_aws: Cloud,
  int_elevenlabs: Mic,
  int_images: Image,
  int_video: Video,
};

function IntegrationCard({ integration }: { integration: Integration }) {
  const Icon = ICONS[integration.id] ?? Plug;

  return (
    <article className="card-surface flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{integration.name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {integration.vendor} · {INTEGRATION_CATEGORY_LABELS[integration.category]}
          </p>
        </div>
        <Badge tone="neutral">Not connected</Badge>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{integration.purpose}</p>

      <div className="mt-4">
        <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          What it would do
        </h3>
        <ul className="mt-1.5 space-y-1">
          {integration.capabilities.map((capability) => (
            <li key={capability} className="flex gap-2 text-xs leading-relaxed">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
              {capability}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          What it needs first
        </h3>
        <ul className="mt-1.5 space-y-1">
          {integration.requires.map((requirement) => (
            <li key={requirement} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
              {requirement}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Button variant="secondary" size="sm" disabled title="Connecting requires a backend that can hold credentials">
          Connect
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={integration.docsUrl} target="_blank" rel="noreferrer noopener">
            Documentation <ExternalLink />
          </a>
        </Button>
      </div>
      <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
        Connecting is deliberately unavailable: it needs a server that can hold the credentials. Nothing
        in this frontend collects, stores or transmits a key.
      </p>
    </article>
  );
}

export function IntegrationsPage() {
  const { integrations } = useSnapshot();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Integrations"
        description="The external services NovaStudio is designed around. None of them is connected in this phase."
      />

      <Section
        title="Why nothing connects yet"
        description="This phase is frontend-only, and that is a deliberate boundary."
      >
        <ul className="space-y-2 text-sm leading-relaxed">
          <li className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
            Every one of these services authenticates with a long-lived secret. A browser cannot hold one
            safely, so the credential exchange belongs on a server that does not exist yet.
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
            Generation and publishing are expensive and hard to undo. They need a queue, retries, spend
            caps and an audit trail — backend concerns, not UI ones.
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
            The service layer in <code className="rounded bg-subtle px-1">src/services/api.ts</code> is
            the seam. Each function there maps to an endpoint, so wiring a real backend means changing that
            file and nothing in the screens.
          </li>
        </ul>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}
