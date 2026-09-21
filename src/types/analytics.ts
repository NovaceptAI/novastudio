import type { IsoDate } from './common';

/** One channel's numbers for one day, as YouTube Analytics will report them. */
export interface DailyChannelMetrics {
  date: IsoDate;
  channelId: string;
  impressions: number;
  views: number;
  /** Derived: views x average view duration. */
  watchTimeHours: number;
  subscribersGained: number;
  subscribersLost: number;
  /** Derived: views / impressions, stored as a percentage. */
  thumbnailCtr: number;
  averagePercentageViewed: number;
  averageViewDurationSeconds: number;
  shortsViews: number;
  longFormViews: number;
  /** `null` when the channel is not monetised. */
  revenue: number | null;
  productionCost: number;
  videosPublished: number;
}

/** Aggregate over a date range, used by stat tiles and the channel table. */
export interface ChannelPerformance {
  channelId: string;
  views: number;
  watchTimeHours: number;
  subscribersNet: number;
  impressions: number;
  thumbnailCtr: number;
  averagePercentageViewed: number;
  shortsViews: number;
  longFormViews: number;
  revenue: number | null;
  productionCost: number;
  videosPublished: number;
  /** Percentage change against the immediately preceding window. */
  viewsChangePct: number;
}

export interface TimeseriesPoint {
  date: IsoDate;
  views: number;
  watchTimeHours: number;
  published: number;
  subscribersGained: number;
  revenue: number;
  productionCost: number;
}
