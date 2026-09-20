import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFilters, useScopedChannelIds, useSnapshot } from '@/store/app-store';
import {
  Badge,
  Button,
  SortableTh,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { ChannelAvatar, DateRangeFilter, DemoDataNotice, PageHeader, StatTile } from '@/components/common';
import { ChartFrame, ChartLegend } from '@/components/charts/chart-kit';
import { ChannelViewsChart, FormatSplitChart, ViewsAreaChart } from '@/components/charts/activity-chart';
import { buildTimeseries, filterMetrics, performanceByChannel, totalsFor } from '@/lib/analytics';
import {
  formatCompactInr,
  formatCompactNumber,
  formatCurrency,
  formatHours,
  formatNumber,
  formatPercent,
} from '@/lib/format';
import { eachDay } from '@/lib/date';
import { useSortableTable } from '@/hooks/use-sortable-table';

export function AnalyticsPage() {
  const { channels, metrics } = useSnapshot();
  const { range, channelId } = useFilters();
  const scopedIds = useScopedChannelIds();
  const [showTable, setShowTable] = useState(false);

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

  /** One column per channel, so colour stays attached to the channel. */
  const perChannelSeries = useMemo(() => {
    const rows = eachDay(range).map((date) => {
      const point: Record<string, number | string> = {
        date,
        views: 0,
        watchTimeHours: 0,
        published: 0,
        subscribersGained: 0,
        revenue: 0,
        productionCost: 0,
      };
      for (const id of scopedIds) point[id] = 0;
      return point;
    });
    const index = new Map(rows.map((row) => [row.date as string, row]));
    for (const metric of filterMetrics(metrics, range, scopedIds)) {
      const row = index.get(metric.date);
      if (!row) continue;
      row[metric.channelId] = Number(row[metric.channelId] ?? 0) + metric.views;
      row.views = Number(row.views) + metric.views;
    }
    return rows;
  }, [metrics, range, scopedIds]);

  const splitSeries = useMemo(() => {
    const rows = eachDay(range).map((date) => ({ date, shortsViews: 0, longFormViews: 0 }));
    const index = new Map(rows.map((row) => [row.date, row]));
    for (const metric of filterMetrics(metrics, range, scopedIds)) {
      const row = index.get(metric.date);
      if (!row) continue;
      row.shortsViews += metric.shortsViews;
      row.longFormViews += metric.longFormViews;
    }
    return rows;
  }, [metrics, range, scopedIds]);

  const channelSeries = useMemo(
    () =>
      channels
        .filter((channel) => scopedIds.includes(channel.id))
        .map((channel) => ({
          channelId: channel.id,
          name: channel.name,
          color: channel.branding.accentColor,
        })),
    [channels, scopedIds],
  );

  const rows = useMemo(
    () =>
      performances.map((performance) => {
        const channel = channels.find((item) => item.id === performance.channelId)!;
        return { ...performance, name: channel.name, channel };
      }),
    [performances, channels],
  );
  const { sorted, sortKey, direction, toggle } = useSortableTable(rows, 'views', 'desc');

  const selectedChannel = channels.find((channel) => channel.id === channelId);
  const singleChannel = Boolean(selectedChannel);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description={
          selectedChannel
            ? `${selectedChannel.name} — seeded performance for the selected range.`
            : 'Seeded performance across the channel network.'
        }
        actions={<DateRangeFilter />}
      />

      <DemoDataNotice>
        Demo data — seeded from each channel's configuration. Impressions are derived from views and CTR,
        watch time from views and average view duration, and Shorts plus long-form always add up to total
        views. No YouTube Analytics data is involved.
      </DemoDataNotice>

      <section aria-label="Headline metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Views" value={formatCompactNumber(totals.views)} changePct={totals.viewsChangePct} />
        <StatTile label="Watch time" value={formatHours(totals.watchTimeHours)} />
        <StatTile
          label="Subscribers gained (net)"
          value={formatNumber(totals.subscribersNet)}
          footnote="gained minus lost"
        />
        <StatTile
          label="Thumbnail CTR"
          value={formatPercent(totals.thumbnailCtr, 2)}
          footnote={`${formatCompactNumber(totals.impressions)} impressions`}
        />
      </section>

      <section aria-label="Cost and revenue" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Average percentage viewed"
          value={formatPercent(totals.averagePercentageViewed)}
          footnote="view-weighted"
        />
        <StatTile
          label="Production cost"
          value={formatCompactInr(totals.productionCost)}
          footnote="seeded estimate in range"
          invertChange
        />
        <StatTile
          label="Revenue"
          value={
            singleChannel && !selectedChannel!.monetised
              ? 'Not monetised'
              : formatCurrency(totals.revenue, 'INR')
          }
          footnote={
            singleChannel
              ? selectedChannel!.monetised
                ? 'seeded estimate'
                : 'no monetisation configured'
              : totals.hasUnmonetised
                ? 'excludes channels that are not monetised'
                : 'seeded estimate'
          }
        />
        <StatTile
          label="Shorts share of views"
          value={formatPercent(
            totals.views === 0 ? 0 : (totals.shortsViews / totals.views) * 100,
          )}
          footnote={`${formatCompactNumber(totals.longFormViews)} long-form views`}
        />
      </section>

      <ChartFrame title="Views over time" description="Daily views for the channels in scope.">
        <ViewsAreaChart data={series} height={240} />
      </ChartFrame>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartFrame
          title="Views by channel"
          description="One line per channel; colour stays with the channel when the selection changes."
          legend={
            <ChartLegend
              items={channelSeries.map((item) => ({ label: item.name, color: item.color }))}
            />
          }
          actions={
            <Button variant="ghost" size="sm" onClick={() => setShowTable((value) => !value)}>
              {showTable ? 'Hide table' : 'Show as table'}
            </Button>
          }
        >
          <ChannelViewsChart data={perChannelSeries} series={channelSeries} height={250} />
          {showTable && (
            <TableWrap className="mt-3 max-h-64 overflow-y-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    {channelSeries.map((item) => (
                      <Th key={item.channelId} className="text-right">
                        {item.name}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perChannelSeries.map((row) => (
                    <Tr key={String(row.date)}>
                      <Td className="whitespace-nowrap text-muted-foreground">{String(row.date)}</Td>
                      {channelSeries.map((item) => (
                        <Td key={item.channelId} className="tabular text-right">
                          {formatNumber(Number(row[item.channelId] ?? 0))}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </ChartFrame>

        <ChartFrame
          title="Shorts and long-form"
          description="Stacked daily views. The two parts add up to the total."
          legend={
            <ChartLegend
              items={[
                { label: 'Long-form', color: 'hsl(243 75.4% 58.6%)' },
                { label: 'Shorts', color: 'hsl(187 92% 33%)' },
              ]}
            />
          }
        >
          <FormatSplitChart data={splitSeries} height={250} />
        </ChartFrame>
      </div>

      <section className="card-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Per-channel performance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Channels without monetisation report “Not monetised” rather than zero revenue.
          </p>
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
                <SortableTh active={sortKey === 'longFormViews'} direction={direction} onSort={() => toggle('longFormViews')} className="text-right">
                  Long-form
                </SortableTh>
                <SortableTh active={sortKey === 'shortsViews'} direction={direction} onSort={() => toggle('shortsViews')} className="text-right">
                  Shorts
                </SortableTh>
                <SortableTh active={sortKey === 'watchTimeHours'} direction={direction} onSort={() => toggle('watchTimeHours')} className="text-right">
                  Watch time
                </SortableTh>
                <SortableTh active={sortKey === 'thumbnailCtr'} direction={direction} onSort={() => toggle('thumbnailCtr')} className="text-right">
                  CTR
                </SortableTh>
                <SortableTh active={sortKey === 'averagePercentageViewed'} direction={direction} onSort={() => toggle('averagePercentageViewed')} className="text-right">
                  Avg viewed
                </SortableTh>
                <SortableTh active={sortKey === 'productionCost'} direction={direction} onSort={() => toggle('productionCost')} className="text-right">
                  Cost
                </SortableTh>
                <Th className="text-right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <Tr key={row.channelId}>
                  <Td>
                    <Link
                      to={`/channels/${row.channel.slug}`}
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <ChannelAvatar channel={row.channel} size="sm" />
                      <span className="truncate">{row.name}</span>
                    </Link>
                  </Td>
                  <Td className="tabular text-right">{formatCompactNumber(row.views)}</Td>
                  <Td className="tabular text-right">{formatCompactNumber(row.longFormViews)}</Td>
                  <Td className="tabular text-right">{formatCompactNumber(row.shortsViews)}</Td>
                  <Td className="tabular text-right">{formatHours(row.watchTimeHours)}</Td>
                  <Td className="tabular text-right">{formatPercent(row.thumbnailCtr, 2)}</Td>
                  <Td className="tabular text-right">{formatPercent(row.averagePercentageViewed)}</Td>
                  <Td className="tabular text-right">{formatCompactInr(row.productionCost)}</Td>
                  <Td className="tabular text-right">
                    {row.revenue === null ? (
                      <Badge tone="neutral">Not monetised</Badge>
                    ) : (
                      formatCurrency(row.revenue, 'INR')
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </section>
    </div>
  );
}
