import type {
  ChannelPerformance,
  DailyChannelMetrics,
  DateRange,
  TimeseriesPoint,
} from '@/types';
import { eachDay, isWithinRange, previousRange } from './date';
import { percentChange, sum } from './utils';

/** Weighted mean, used so aggregate CTR and retention stay view-weighted. */
function weightedMean(values: number[], weights: number[]): number {
  const totalWeight = sum(weights);
  if (totalWeight === 0) return 0;
  return values.reduce((total, value, index) => total + value * weights[index], 0) / totalWeight;
}

export function filterMetrics(
  metrics: DailyChannelMetrics[],
  range: DateRange,
  channelIds?: string[],
): DailyChannelMetrics[] {
  const allowed = channelIds && channelIds.length ? new Set(channelIds) : null;
  return metrics.filter(
    (metric) => isWithinRange(metric.date, range) && (!allowed || allowed.has(metric.channelId)),
  );
}

/**
 * Aggregates one channel's daily rows into a single row. Derived fields are
 * recomputed from the totals rather than averaged, so `views / impressions`
 * still equals the reported CTR.
 */
export function aggregateChannel(
  channelId: string,
  rows: DailyChannelMetrics[],
  previousRows: DailyChannelMetrics[],
  monetised: boolean,
): ChannelPerformance {
  const views = sum(rows.map((row) => row.views));
  const impressions = sum(rows.map((row) => row.impressions));
  const previousViews = sum(previousRows.map((row) => row.views));

  return {
    channelId,
    views,
    impressions,
    watchTimeHours: Number(sum(rows.map((row) => row.watchTimeHours)).toFixed(1)),
    subscribersNet: sum(rows.map((row) => row.subscribersGained - row.subscribersLost)),
    thumbnailCtr: impressions === 0 ? 0 : Number(((views / impressions) * 100).toFixed(2)),
    averagePercentageViewed: Number(
      weightedMean(
        rows.map((row) => row.averagePercentageViewed),
        rows.map((row) => row.views),
      ).toFixed(1),
    ),
    shortsViews: sum(rows.map((row) => row.shortsViews)),
    longFormViews: sum(rows.map((row) => row.longFormViews)),
    revenue: monetised ? sum(rows.map((row) => row.revenue ?? 0)) : null,
    productionCost: sum(rows.map((row) => row.productionCost)),
    videosPublished: sum(rows.map((row) => row.videosPublished)),
    viewsChangePct: Number(percentChange(views, previousViews).toFixed(1)),
  };
}

export function performanceByChannel(
  metrics: DailyChannelMetrics[],
  range: DateRange,
  channelIds: string[],
  monetisedIds: Set<string>,
): ChannelPerformance[] {
  const prior = previousRange(range);
  return channelIds.map((channelId) =>
    aggregateChannel(
      channelId,
      filterMetrics(metrics, range, [channelId]),
      filterMetrics(metrics, prior, [channelId]),
      monetisedIds.has(channelId),
    ),
  );
}

/** One point per day in the range, summed across the selected channels. */
export function buildTimeseries(
  metrics: DailyChannelMetrics[],
  range: DateRange,
  channelIds?: string[],
): TimeseriesPoint[] {
  const rows = filterMetrics(metrics, range, channelIds);
  const byDate = new Map<string, TimeseriesPoint>();

  for (const date of eachDay(range)) {
    byDate.set(date, {
      date,
      views: 0,
      watchTimeHours: 0,
      published: 0,
      subscribersGained: 0,
      revenue: 0,
      productionCost: 0,
    });
  }

  for (const row of rows) {
    const point = byDate.get(row.date);
    if (!point) continue;
    point.views += row.views;
    point.watchTimeHours += row.watchTimeHours;
    point.published += row.videosPublished;
    point.subscribersGained += row.subscribersGained;
    point.revenue += row.revenue ?? 0;
    point.productionCost += row.productionCost;
  }

  return [...byDate.values()].map((point) => ({
    ...point,
    watchTimeHours: Number(point.watchTimeHours.toFixed(1)),
  }));
}

/** Totals across every selected channel, for the stat tiles. */
export function totalsFor(
  metrics: DailyChannelMetrics[],
  range: DateRange,
  channelIds: string[],
  monetisedIds: Set<string>,
) {
  const performances = performanceByChannel(metrics, range, channelIds, monetisedIds);
  const views = sum(performances.map((row) => row.views));
  const impressions = sum(performances.map((row) => row.impressions));
  const previousViews = sum(
    channelIds.map((channelId) =>
      sum(filterMetrics(metrics, previousRange(range), [channelId]).map((row) => row.views)),
    ),
  );

  return {
    views,
    impressions,
    watchTimeHours: Number(sum(performances.map((row) => row.watchTimeHours)).toFixed(1)),
    subscribersNet: sum(performances.map((row) => row.subscribersNet)),
    thumbnailCtr: impressions === 0 ? 0 : Number(((views / impressions) * 100).toFixed(2)),
    averagePercentageViewed: Number(
      weightedMean(
        performances.map((row) => row.averagePercentageViewed),
        performances.map((row) => row.views),
      ).toFixed(1),
    ),
    shortsViews: sum(performances.map((row) => row.shortsViews)),
    longFormViews: sum(performances.map((row) => row.longFormViews)),
    /** Only monetised channels contribute; the rest report no revenue at all. */
    revenue: sum(performances.map((row) => row.revenue ?? 0)),
    hasUnmonetised: performances.some((row) => row.revenue === null),
    productionCost: sum(performances.map((row) => row.productionCost)),
    videosPublished: sum(performances.map((row) => row.videosPublished)),
    viewsChangePct: Number(percentChange(views, previousViews).toFixed(1)),
  };
}
