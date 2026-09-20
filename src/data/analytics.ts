import type { DailyChannelMetrics, IsoDate, VideoProject } from '@/types';
import { CHANNELS } from './channels';
import { DEMO_TODAY, addDays, eachDay, weekdayOf } from '@/lib/date';
import { hashString, seededRandom } from '@/lib/utils';

/**
 * Daily per-channel metrics for the last 180 days.
 *
 * Everything derived is derived rather than invented: impressions come from
 * views and CTR, watch time comes from views and average view duration,
 * shorts + long-form always sum to views, and `videosPublished` counts the
 * projects that actually carry a publish date on that day. Revenue is `null`
 * for the channels configured as not monetised.
 */

const HISTORY_DAYS = 180;

interface ChannelProfile {
  /** Daily views as a share of the subscriber count. */
  viewRate: number;
  ctr: number;
  retention: number;
  shortsShare: number;
  /** Revenue per 1,000 long-form views, in INR. */
  longFormRpm: number;
  shortsRpm: number;
  weekendLift: number;
}

const PROFILES: Record<string, ChannelProfile> = {
  ch_ai_smb: { viewRate: 0.071, ctr: 6.4, retention: 44, shortsShare: 0.18, longFormRpm: 148, shortsRpm: 9, weekendLift: -0.12 },
  ch_office: { viewRate: 0.083, ctr: 7.1, retention: 41, shortsShare: 0.31, longFormRpm: 112, shortsRpm: 8, weekendLift: -0.18 },
  ch_english: { viewRate: 0.094, ctr: 8.2, retention: 47, shortsShare: 0.27, longFormRpm: 58, shortsRpm: 5, weekendLift: 0.06 },
  ch_brands: { viewRate: 0.062, ctr: 5.8, retention: 52, shortsShare: 0.09, longFormRpm: 176, shortsRpm: 11, weekendLift: 0.14 },
  ch_growth: { viewRate: 0.068, ctr: 6.9, retention: 39, shortsShare: 0.34, longFormRpm: 94, shortsRpm: 6, weekendLift: 0.09 },
  ch_relationships: { viewRate: 0.052, ctr: 5.1, retention: 49, shortsShare: 0.05, longFormRpm: 0, shortsRpm: 0, weekendLift: 0.11 },
  ch_cricket: { viewRate: 0.104, ctr: 7.8, retention: 38, shortsShare: 0.42, longFormRpm: 86, shortsRpm: 7, weekendLift: 0.22 },
  ch_pets: { viewRate: 0.079, ctr: 8.6, retention: 43, shortsShare: 0.36, longFormRpm: 102, shortsRpm: 8, weekendLift: 0.16 },
  ch_mystery: { viewRate: 0.088, ctr: 6.2, retention: 56, shortsShare: 0.04, longFormRpm: 64, shortsRpm: 4, weekendLift: 0.19 },
  ch_kids: { viewRate: 0.046, ctr: 5.4, retention: 61, shortsShare: 0.12, longFormRpm: 0, shortsRpm: 0, weekendLift: 0.24 },
};

function publishCountsByDay(projects: VideoProject[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const publishedAt = project.publishing.publishedAt;
    if (!publishedAt) continue;
    const key = `${project.channelId}|${publishedAt.slice(0, 10)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function buildDailyMetrics(projects: VideoProject[]): DailyChannelMetrics[] {
  const published = publishCountsByDay(projects);
  const from: IsoDate = addDays(DEMO_TODAY, -(HISTORY_DAYS - 1));
  const days = eachDay({ from, to: DEMO_TODAY });
  const metrics: DailyChannelMetrics[] = [];

  for (const channel of CHANNELS) {
    const profile = PROFILES[channel.id];
    const random = seededRandom(hashString(`metrics_${channel.id}`));
    const midDuration =
      ((channel.config.targetDurationMinutes.min + channel.config.targetDurationMinutes.max) / 2) * 60;
    const dailyBudget = channel.config.monthlyBudget / 30.44;
    /** Recent days are worth more than old ones; channels are still growing. */
    const growthPerDay = 0.0016 + random() * 0.0012;
    let recentPublishLift = 0;

    days.forEach((date, index) => {
      const age = days.length - index;
      const trend = 1 / (1 + growthPerDay * age);
      const weekday = weekdayOf(date);
      const weekend = weekday === 'sat' || weekday === 'sun';
      const seasonal = 1 + (weekend ? profile.weekendLift : 0);
      const noise = 0.88 + random() * 0.24;

      const videosPublished = published.get(`${channel.id}|${date}`) ?? 0;
      // A release lifts the channel for a few days, then decays.
      recentPublishLift = recentPublishLift * 0.72 + videosPublished * 0.38;

      const views = Math.max(
        120,
        Math.round(channel.subscribers * profile.viewRate * trend * seasonal * noise * (1 + recentPublishLift)),
      );

      const thumbnailCtr = Number((profile.ctr * (0.92 + random() * 0.16)).toFixed(2));
      const impressions = Math.round(views / (thumbnailCtr / 100));
      const averagePercentageViewed = Number((profile.retention * (0.94 + random() * 0.12)).toFixed(1));
      const averageViewDurationSeconds = Math.round((averagePercentageViewed / 100) * midDuration);
      const watchTimeHours = Number(((views * averageViewDurationSeconds) / 3600).toFixed(1));

      const shortsViews = Math.round(views * profile.shortsShare * (0.86 + random() * 0.28));
      const longFormViews = Math.max(0, views - shortsViews);

      const subscribersGained = Math.round(views * (0.0042 + random() * 0.0034) * (1 + recentPublishLift * 0.4));
      const subscribersLost = Math.round(subscribersGained * (0.14 + random() * 0.18));

      const revenue = channel.monetised
        ? Number(
            ((longFormViews / 1000) * profile.longFormRpm + (shortsViews / 1000) * profile.shortsRpm).toFixed(0),
          )
        : null;

      const productionCost = Math.round(
        dailyBudget * (0.55 + random() * 0.35) + videosPublished * dailyBudget * 1.6,
      );

      metrics.push({
        date,
        channelId: channel.id,
        impressions,
        views,
        watchTimeHours,
        subscribersGained,
        subscribersLost,
        thumbnailCtr,
        averagePercentageViewed,
        averageViewDurationSeconds,
        shortsViews,
        longFormViews,
        revenue,
        productionCost,
        videosPublished,
      });
    });
  }

  return metrics;
}
