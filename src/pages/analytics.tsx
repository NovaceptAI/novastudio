import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Plug } from 'lucide-react';
import { useFilters, useScopedChannelIds, useSnapshot } from '@/store/app-store';
import { Badge, Button, EmptyState, Table, TableWrap, Td, Th, Tr } from '@/components/ui';
import { ChannelAvatar, DateRangeFilter, PageHeader, StatTile } from '@/components/common';
import { ChartFrame } from '@/components/charts/chart-kit';
import { PublishingActivityChart } from '@/components/charts/activity-chart';
import type { TimeseriesPoint } from '@/types';
import { publishedInRange, scopeProjects } from '@/lib/selectors';
import { eachDay } from '@/lib/date';
import { formatCompactInr, formatCurrency, formatNumber } from '@/lib/format';
import { sum } from '@/lib/utils';

/**
 * Production analytics only. Views, watch time, CTR, subscribers and revenue
 * come from YouTube Analytics, which is not connected, so this screen reports
 * what the workspace itself knows — what shipped and what it cost — and says
 * plainly that audience numbers are unavailable rather than showing zeros.
 */
export function AnalyticsPage() {
  const { channels, projects } = useSnapshot();
  const { range } = useFilters();
  const scopedIds = useScopedChannelIds();

  const scoped = useMemo(() => scopeProjects(projects, scopedIds), [projects, scopedIds]);
  const published = useMemo(() => publishedInRange(scoped, range), [scoped, range]);

  const series = useMemo<TimeseriesPoint[]>(() => {
    const perDay = new Map<string, number>();
    for (const project of published) {
      const day = project.publishing.publishedAt!.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    return eachDay(range).map((date) => ({
      date,
      published: perDay.get(date) ?? 0,
      views: 0,
      watchTimeHours: 0,
      subscribersGained: 0,
      revenue: 0,
      productionCost: 0,
    }));
  }, [published, range]);

  const shorts = published.filter((project) => project.format === 'short').length;
  const actualSpend = sum(published.map((project) => project.actualCost ?? project.estimatedCost));
  const inFlight = scoped.filter((project) => project.stage !== 'published' && project.stage !== 'idea');
  const committed = sum(inFlight.map((project) => project.estimatedCost));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="What the network has shipped and what it cost, from the videos tracked here."
        actions={<DateRangeFilter />}
      />

      <section className="card-surface flex flex-wrap items-start gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted-foreground">
          <Plug className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Audience numbers need YouTube</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Views, watch time, subscribers, thumbnail CTR, average percentage viewed and revenue come
            from YouTube Analytics. Until a channel is connected there is nothing real to show, so this
            page does not show them.
          </p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/integrations">Integrations</Link>
        </Button>
      </section>

      <section aria-label="Production totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Published in range" value={formatNumber(published.length)} />
        <StatTile
          label="Long-form / Shorts"
          value={`${published.length - shorts} / ${shorts}`}
          footnote="published in range"
        />
        <StatTile
          label="Spend on published"
          value={formatCompactInr(actualSpend)}
          footnote="actual cost where recorded, else the estimate"
        />
        <StatTile label="Committed" value={formatCompactInr(committed)} footnote={`${inFlight.length} videos in flight`} />
      </section>

      <ChartFrame title="Videos published" description="Per day, in the selected range.">
        {published.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing published in this range"
            description="Videos appear here once they reach the Published stage."
          />
        ) : (
          <PublishingActivityChart data={series} />
        )}
      </ChartFrame>

      <section className="card-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Per channel</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Production in the selected range, against budget.</p>
        </div>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Channel</Th>
                <Th className="text-right">Published</Th>
                <Th className="text-right">Long-form</Th>
                <Th className="text-right">Shorts</Th>
                <Th className="text-right">Spend</Th>
                <Th className="text-right">Monthly budget</Th>
                <Th className="text-right">Revenue</Th>
              </tr>
            </thead>
            <tbody>
              {channels
                .filter((channel) => scopedIds.includes(channel.id))
                .map((channel) => {
                  const rows = published.filter((project) => project.channelId === channel.id);
                  const channelShorts = rows.filter((project) => project.format === 'short').length;
                  return (
                    <Tr key={channel.id}>
                      <Td>
                        <Link
                          to={`/channels/${channel.slug}`}
                          className="flex items-center gap-2 font-medium hover:text-primary"
                        >
                          <ChannelAvatar channel={channel} size="sm" />
                          <span className="truncate">{channel.name}</span>
                        </Link>
                      </Td>
                      <Td className="tabular text-right">{rows.length}</Td>
                      <Td className="tabular text-right">{rows.length - channelShorts}</Td>
                      <Td className="tabular text-right">{channelShorts}</Td>
                      <Td className="tabular text-right">
                        {formatCurrency(sum(rows.map((project) => project.actualCost ?? project.estimatedCost)))}
                      </Td>
                      <Td className="tabular text-right">
                        {channel.config.monthlyBudget ? (
                          formatCurrency(channel.config.monthlyBudget)
                        ) : (
                          <span className="text-2xs text-muted-foreground">Not set</span>
                        )}
                      </Td>
                      <Td className="text-right">
                        <Badge tone="neutral">{channel.monetised ? 'Needs YouTube' : 'Not monetised'}</Badge>
                      </Td>
                    </Tr>
                  );
                })}
            </tbody>
          </Table>
        </TableWrap>
      </section>
    </div>
  );
}
