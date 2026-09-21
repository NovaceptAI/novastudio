import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Rows3, Search } from 'lucide-react';
import { useSnapshot } from '@/store/app-store';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  NativeSelect,
  SortableTh,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { ChannelAvatar, PageHeader } from '@/components/common';
import {
  AUDIENCE_RATING_LABELS,
  CHANNEL_STATUS_LABELS,
  CHANNEL_STATUS_TONES,
  LANGUAGE_SHORT,
  WEEKDAY_LABELS,
  type ChannelStatus,
} from '@/types';
import { formatCompactInr } from '@/lib/format';
import { cn, matchesQuery } from '@/lib/utils';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { missingSetup } from '@/data/channels';
import { inProduction, scopeProjects } from '@/lib/selectors';

type ViewMode = 'grid' | 'table';

export function ChannelsPage() {
  const { channels, projects } = useSnapshot();
  const [view, setView] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ChannelStatus | 'all'>('all');

  const enriched = useMemo(
    () =>
      channels.map((channel) => {
        const channelProjects = scopeProjects(projects, [channel.id]);
        return {
          channel,
          id: channel.id,
          name: channel.name,
          niche: channel.niche,
          status: channel.status,
          setupDone: 7 - missingSetup(channel).length,
          queue: inProduction(channelProjects).length,
          backlog: channelProjects.filter((project) => project.stage !== 'published').length,
          budget: channel.config.monthlyBudget,
          cadence: channel.config.cadence.videosPerWeek,
        };
      }),
    [channels, projects],
  );

  const filtered = useMemo(
    () =>
      enriched.filter(
        (row) =>
          (status === 'all' || row.status === status) &&
          matchesQuery(query, row.name, row.niche, row.channel.description),
      ),
    [enriched, query, status],
  );

  const { sorted, sortKey, direction, toggle } = useSortableTable(filtered, 'name', 'asc');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Channels"
        description="The ten channels, how far each one's setup has got, and how much work it has in flight."
        actions={
          <div className="flex items-center rounded-lg border border-border-strong bg-card p-0.5">
            <Button
              variant={view === 'grid' ? 'soft' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
            >
              <LayoutGrid /> Grid
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
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter channels…"
            aria-label="Filter channels"
            className="pl-8"
          />
        </div>
        <NativeSelect
          value={status}
          onChange={(event) => setStatus(event.target.value as ChannelStatus | 'all')}
          aria-label="Filter by status"
          className="w-auto min-w-36"
        >
          <option value="all">All statuses</option>
          {(Object.keys(CHANNEL_STATUS_LABELS) as ChannelStatus[]).map((value) => (
            <option key={value} value={value}>
              {CHANNEL_STATUS_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <span className="text-2xs text-muted-foreground">
          {filtered.length} of {channels.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            title="No channels match those filters"
            description="Clear the search box or pick a different status."
            action={{
              label: 'Clear filters',
              onClick: () => {
                setQuery('');
                setStatus('all');
              },
            }}
          />
        </div>
      ) : view === 'grid' ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ channel, queue }) => (
            <li key={channel.id} className="min-w-0">
              <Link
                to={`/channels/${channel.slug}`}
                className="card-surface flex h-full flex-col p-4 transition-shadow hover:shadow-pop"
              >
                <div className="flex items-start gap-3">
                  <ChannelAvatar channel={channel} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{channel.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {missingSetup(channel).length === 0
                        ? 'Ready to produce'
                        : `Setup: ${7 - missingSetup(channel).length} of 7 done`}
                    </p>
                  </div>
                  <Badge tone={CHANNEL_STATUS_TONES[channel.status]}>
                    {CHANNEL_STATUS_LABELS[channel.status]}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {channel.config.languages.map((language) => (
                    <Badge key={language} tone="neutral">
                      {LANGUAGE_SHORT[language]}
                    </Badge>
                  ))}
                  {channel.audienceRating !== 'general' && (
                    <Badge tone={channel.audienceRating === 'mature' ? 'danger' : 'accent'}>
                      {AUDIENCE_RATING_LABELS[channel.audienceRating]}
                    </Badge>
                  )}
                  {!channel.monetised && <Badge tone="neutral">Not monetised</Badge>}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                  <div>
                    <dt className="text-2xs text-muted-foreground">Cadence</dt>
                    <dd className="tabular text-sm font-medium">
                      {channel.config.cadence.videosPerWeek ? `${channel.config.cadence.videosPerWeek}/wk` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-muted-foreground">In production</dt>
                    <dd className="tabular text-sm font-medium">{queue}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-muted-foreground">Budget</dt>
                    <dd className="tabular text-sm font-medium">
                      {channel.config.monthlyBudget ? formatCompactInr(channel.config.monthlyBudget) : '—'}
                    </dd>
                  </div>
                </dl>

              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-surface">
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <SortableTh active={sortKey === 'name'} direction={direction} onSort={() => toggle('name')}>
                    Channel
                  </SortableTh>
                  <Th>Setup</Th>
                  <Th>Languages</Th>
                  <Th>Status</Th>
                  <SortableTh active={sortKey === 'cadence'} direction={direction} onSort={() => toggle('cadence')} className="text-right">
                    Cadence
                  </SortableTh>
                  <SortableTh active={sortKey === 'queue'} direction={direction} onSort={() => toggle('queue')} className="text-right">
                    In production
                  </SortableTh>
                  <SortableTh active={sortKey === 'budget'} direction={direction} onSort={() => toggle('budget')} className="text-right">
                    Monthly budget
                  </SortableTh>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <Link
                        to={`/channels/${row.channel.slug}`}
                        className="flex items-center gap-2 font-medium hover:text-primary"
                      >
                        <ChannelAvatar channel={row.channel} size="sm" />
                        <span className="truncate">{row.name}</span>
                      </Link>
                    </Td>
                    <Td className="text-muted-foreground">
                      {missingSetup(row.channel).length === 0 ? 'Ready' : `${7 - missingSetup(row.channel).length} of 7`}
                    </Td>
                    <Td>
                      <span className="flex gap-1">
                        {row.channel.config.languages.map((language) => (
                          <Badge key={language}>{LANGUAGE_SHORT[language]}</Badge>
                        ))}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={CHANNEL_STATUS_TONES[row.status]}>
                        {CHANNEL_STATUS_LABELS[row.status]}
                      </Badge>
                    </Td>
                    <Td className="tabular text-right">
                      <span className="block">{row.cadence ? `${row.cadence}/week` : 'Not set'}</span>
                      <span className={cn('block text-2xs text-muted-foreground')}>
                        {row.channel.config.cadence.publishDays
                          .map((day) => WEEKDAY_LABELS[day])
                          .join(', ')}
                      </span>
                    </Td>
                    <Td className="tabular text-right">{row.queue}</Td>
                    <Td className="tabular text-right">{row.budget ? formatCompactInr(row.budget) : 'Not set'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}
    </div>
  );
}
