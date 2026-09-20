import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Film,
  Info,
  PlayCircle,
  Radio,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { useData, useFilters, useScopedChannelIds, useSnapshot } from '@/store/app-store';
import {
  Badge,
  Button,
  LoadingState,
  SortableTh,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  EmptyState,
} from '@/components/ui';
import {
  ChannelAvatar,
  DateRangeFilter,
  DemoDataNotice,
  PageHeader,
  StatTile,
  StageBadge,
} from '@/components/common';
import { ChartFrame } from '@/components/charts/chart-kit';
import { PublishingActivityChart, ViewsAreaChart } from '@/components/charts/activity-chart';
import { buildTimeseries, performanceByChannel, totalsFor } from '@/lib/analytics';
import {
  attentionItems,
  awaitingReview,
  committedSpend,
  inProduction,
  publishedInRange,
  scheduled,
  scopeProjects,
  upcomingReleases,
} from '@/lib/selectors';
import { formatCompactInr, formatCompactNumber, formatCurrency, formatHours, formatNumber, formatPercent } from '@/lib/format';
import { formatDateTime, relativeToToday } from '@/lib/date';
import { useSortableTable } from '@/hooks/use-sortable-table';
import type { ChannelPerformance } from '@/types';

const SEVERITY_ICON = { danger: TriangleAlert, warning: AlertTriangle, info: Info } as const;
const SEVERITY_TONE = { danger: 'danger', warning: 'warning', info: 'info' } as const;

export function OverviewPage() {
  const { loading } = useData();
  const { channels, projects, metrics, settings } = useSnapshot();
  const { range, channelId } = useFilters();
  const scopedIds = useScopedChannelIds();

  const scoped = useMemo(() => scopeProjects(projects, scopedIds), [projects, scopedIds]);
  const monetisedIds = useMemo(
    () => new Set(channels.filter((channel) => channel.monetised).map((channel) => channel.id)),
    [channels],
  );

  const totals = useMemo(
    () => totalsFor(metrics, range, scopedIds, monetisedIds),
    [metrics, range, scopedIds, monetisedIds],
  );
  const series = useMemo(() => buildTimeseries(metrics, range, scopedIds), [metrics, range, scopedIds]);
  const performances = useMemo(
    () => performanceByChannel(metrics, range, scopedIds, monetisedIds),
    [metrics, range, scopedIds, monetisedIds],
  );

  const attention = useMemo(
    () => attentionItems(scoped, channels.filter((channel) => scopedIds.includes(channel.id)), settings, range),
    [scoped, channels, scopedIds, settings, range],
  );
  const upcoming = useMemo(() => upcomingReleases(scoped, 14), [scoped]);

  const activeChannels = channels.filter(
    (channel) => scopedIds.includes(channel.id) && channel.status === 'active',
  ).length;

  const rows = useMemo(
    () =>
      performances.map((performance) => ({
        ...performance,
        name: channels.find((channel) => channel.id === performance.channelId)?.name ?? '',
      })),
    [performances, channels],
  );
  const { sorted, sortKey, direction, toggle } = useSortableTable(rows, 'views', 'desc');

  if (loading) return <LoadingState label="Loading overview…" rows={3} />;

  const selectedChannel = channels.find((channel) => channel.id === channelId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview"
        description={
          selectedChannel
            ? `${selectedChannel.name} — production and performance for the selected range.`
            : 'Production and performance across the channel network.'
        }
        actions={<DateRangeFilter />}
      />

      <DemoDataNotice>
        Demo data — every figure on this screen is locally seeded. No YouTube account is connected, so
        nothing here was measured from a real channel.
      </DemoDataNotice>

      <section aria-label="Network totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Channels"
          value={`${activeChannels} active`}
          footnote={`of ${scopedIds.length} in scope`}
          icon={Radio}
        />
        <StatTile
          label="In production"
          value={formatNumber(inProduction(scoped).length)}
          footnote={`${awaitingReview(scoped).length} awaiting review · ${scheduled(scoped).length} scheduled`}
          icon={Film}
          hint="Projects between Research and Editing. Ideas and published videos are counted separately."
        />
        <StatTile
          label="Published in range"
          value={formatNumber(publishedInRange(scoped, range).length)}
          footnote={formatHours(totals.watchTimeHours) + ' watch time'}
          icon={PlayCircle}
        />
        <StatTile
          label="Views"
          value={formatCompactNumber(totals.views)}
          changePct={totals.viewsChangePct}
          icon={Eye}
          hint="Total views across the selected channels, compared with the immediately preceding window."
        />
      </section>

      <section aria-label="Cost and attention" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Estimated production spend"
          value={formatCompactInr(totals.productionCost)}
          footnote="seeded daily cost in range"
          icon={CircleDollarSign}
          hint="Modelled from each channel's configured monthly budget and its publishing days."
        />
        <StatTile
          label="Committed estimates"
          value={formatCompactInr(committedSpend(scoped))}
          footnote="work in flight, not yet published"
          icon={Timer}
        />
        <StatTile
          label="Average view duration"
          value={formatPercent(totals.averagePercentageViewed)}
          footnote="of video length, view-weighted"
          icon={Clock3}
        />
        <StatTile
          label="Thumbnail CTR"
          value={formatPercent(totals.thumbnailCtr, 2)}
          footnote={`${formatCompactNumber(totals.impressions)} impressions`}
          icon={Eye}
          hint="Recomputed from total views divided by total impressions, not averaged across days."
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartFrame
          title="Publishing activity"
          description="Videos published per day in the selected range."
          className="xl:col-span-1"
        >
          <PublishingActivityChart data={series} />
        </ChartFrame>

        <ChartFrame
          title="Views"
          description="Daily views across the channels in scope."
          className="xl:col-span-2"
        >
          <ViewsAreaChart data={series} height={180} />
        </ChartFrame>
      </div>

      <section className="card-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Channel performance</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Aggregated over the selected range. Channels without monetisation report no revenue.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/analytics">
              Full analytics <ArrowRight />
            </Link>
          </Button>
        </div>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <SortableTh active={sortKey === 'name'} direction={direction} onSort={() => toggle('name')}>
                  Channel
                </SortableTh>
                <SortableTh active={sortKey === 'views'} direction={direction} onSort={() => toggle('views')} className="text-right">
                  Views
                </SortableTh>
                <SortableTh active={sortKey === 'watchTimeHours'} direction={direction} onSort={() => toggle('watchTimeHours')} className="text-right">
                  Watch time
                </SortableTh>
                <SortableTh active={sortKey === 'subscribersNet'} direction={direction} onSort={() => toggle('subscribersNet')} className="text-right">
                  Net subs
                </SortableTh>
                <SortableTh active={sortKey === 'thumbnailCtr'} direction={direction} onSort={() => toggle('thumbnailCtr')} className="text-right">
                  CTR
                </SortableTh>
                <SortableTh active={sortKey === 'videosPublished'} direction={direction} onSort={() => toggle('videosPublished')} className="text-right">
                  Published
                </SortableTh>
                <Th className="text-right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row: ChannelPerformance & { name: string }) => {
                const channel = channels.find((item) => item.id === row.channelId)!;
                return (
                  <Tr key={row.channelId}>
                    <Td>
                      <Link
                        to={`/channels/${channel.slug}`}
                        className="flex items-center gap-2 font-medium hover:text-primary"
                      >
                        <ChannelAvatar channel={channel} size="sm" />
                        <span className="min-w-0 truncate">{channel.name}</span>
                      </Link>
                    </Td>
                    <Td className="tabular text-right">{formatCompactNumber(row.views)}</Td>
                    <Td className="tabular text-right">{formatHours(row.watchTimeHours)}</Td>
                    <Td className="tabular text-right">{formatNumber(row.subscribersNet)}</Td>
                    <Td className="tabular text-right">{formatPercent(row.thumbnailCtr, 2)}</Td>
                    <Td className="tabular text-right">{row.videosPublished}</Td>
                    <Td className="tabular text-right">
                      {row.revenue === null ? (
                        <span className="text-2xs text-muted-foreground">Not monetised</span>
                      ) : (
                        formatCurrency(row.revenue, 'INR')
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-surface flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Upcoming releases</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar">
                Calendar <ArrowRight />
              </Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              title="Nothing scheduled in the next two weeks"
              description="Move a project to Scheduled from the pipeline to hold a publish slot."
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 6).map(({ project, slot }) => {
                const channel = channels.find((item) => item.id === project.channelId)!;
                return (
                  <li key={project.id}>
                    <Link
                      to={`/pipeline/${project.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle/60"
                    >
                      <ChannelAvatar channel={channel} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{project.title}</span>
                        <span className="block truncate text-2xs text-muted-foreground">
                          {channel.name} · {formatDateTime(slot)}
                        </span>
                      </span>
                      <Badge tone="info">{relativeToToday(slot.slice(0, 10))}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card-surface flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Needs attention</h2>
            <Badge tone={attention.length ? 'warning' : 'success'}>{attention.length} open</Badge>
          </div>
          {attention.length === 0 ? (
            <EmptyState title="Nothing needs attention" description="No blocked work, failed jobs or overdue projects in scope." />
          ) : (
            <ul className="divide-y divide-border">
              {attention.slice(0, 7).map((item) => {
                const Icon = SEVERITY_ICON[item.severity];
                return (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      className="flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-subtle/60"
                    >
                      <Icon
                        className={
                          item.severity === 'danger'
                            ? 'mt-0.5 size-4 shrink-0 text-danger'
                            : item.severity === 'warning'
                              ? 'mt-0.5 size-4 shrink-0 text-warning'
                              : 'mt-0.5 size-4 shrink-0 text-info'
                        }
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-2xs text-muted-foreground">{item.detail}</span>
                      </span>
                      <Badge tone={SEVERITY_TONE[item.severity]}>{item.severity}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">In flight right now</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The most recently updated projects that are not published yet.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {scoped
            .filter((project) => project.stage !== 'published')
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 6)
            .map((project) => {
              const channel = channels.find((item) => item.id === project.channelId)!;
              return (
                <li key={project.id}>
                  <Link
                    to={`/pipeline/${project.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle/60"
                  >
                    <ChannelAvatar channel={channel} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{project.title}</span>
                      <span className="block truncate text-2xs text-muted-foreground">
                        {channel.name} · due {relativeToToday(project.dueDate).toLowerCase()}
                      </span>
                    </span>
                    <StageBadge stage={project.stage} />
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}
