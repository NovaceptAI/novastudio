import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Rows3, Search, Users } from 'lucide-react';
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
import { ChannelAvatar, DemoDataNotice, PageHeader } from '@/components/common';
import {
  AUDIENCE_RATING_LABELS,
  CHANNEL_STATUS_LABELS,
  CHANNEL_STATUS_TONES,
  LANGUAGE_SHORT,
  WEEKDAY_LABELS,
  type ChannelStatus,
} from '@/types';
import { formatCompactInr, formatCompactNumber } from '@/lib/format';
import { cn, matchesQuery } from '@/lib/utils';
import { useSortableTable } from '@/hooks/use-sortable-table';
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
          subscribers: channel.subscribers,
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

  const { sorted, sortKey, direction, toggle } = useSortableTable(filtered, 'subscribers', 'desc');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Channels"
        description="Every channel in the network, its configuration and how much work it has in flight."
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

      <DemoDataNotice>
        Demo data — these are internal channel configurations. None of them is linked to a real YouTube
        channel.
      </DemoDataNotice>

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
            <li key={channel.id}>
              <Link
                to={`/channels/${channel.slug}`}
                className="card-surface flex h-full flex-col p-4 transition-shadow hover:shadow-pop"
              >
                <div className="flex items-start gap-3">
                  <ChannelAvatar channel={channel} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{channel.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{channel.niche}</p>
                  </div>
                  <Badge tone={CHANNEL_STATUS_TONES[channel.status]}>
                    {CHANNEL_STATUS_LABELS[channel.status]}
                  </Badge>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>

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
                    <dd className="tabular text-sm font-medium">{channel.config.cadence.videosPerWeek}/wk</dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-muted-foreground">In production</dt>
                    <dd className="tabular text-sm font-medium">{queue}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-muted-foreground">Budget</dt>
                    <dd className="tabular text-sm font-medium">
                      {formatCompactInr(channel.config.monthlyBudget)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <Users className="size-3.5" aria-hidden />
                  {formatCompactNumber(channel.subscribers)} subscribers (demo)
                </p>
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
                  <Th>Niche</Th>
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
                    <Td className="text-muted-foreground">{row.niche}</Td>
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
                      <span className="block">{row.cadence}/week</span>
                      <span className={cn('block text-2xs text-muted-foreground')}>
                        {row.channel.config.cadence.publishDays
                          .map((day) => WEEKDAY_LABELS[day])
                          .join(', ')}
                      </span>
                    </Td>
                    <Td className="tabular text-right">{row.queue}</Td>
                    <Td className="tabular text-right">{formatCompactInr(row.budget)}</Td>
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
