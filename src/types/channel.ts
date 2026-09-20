import type { CurrencyCode, IsoDate, LanguageCode, StatusTone, Weekday } from './common';

export type ChannelStatus = 'active' | 'paused' | 'setup' | 'archived';

export const CHANNEL_STATUS_VALUES = ['active', 'paused', 'setup', 'archived'] as const;

export const CHANNEL_STATUS_LABELS: Record<ChannelStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  setup: 'In setup',
  archived: 'Archived',
};

export const CHANNEL_STATUS_TONES: Record<ChannelStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  setup: 'info',
  archived: 'neutral',
};

/** Audience rating drives the adult-education notice on channel 6. */
export type AudienceRating = 'general' | 'family' | 'mature';

export const AUDIENCE_RATING_LABELS: Record<AudienceRating, string> = {
  general: 'General audience',
  family: 'Made for kids',
  mature: 'Adult educational (18+)',
};

export type VideoFormat =
  | 'long_form'
  | 'short'
  | 'explainer'
  | 'tutorial'
  | 'story'
  | 'interview_style'
  | 'listicle'
  | 'case_study';

export const VIDEO_FORMAT_VALUES = [
  'long_form',
  'short',
  'explainer',
  'tutorial',
  'story',
  'interview_style',
  'listicle',
  'case_study',
] as const;

export const VIDEO_FORMAT_LABELS: Record<VideoFormat, string> = {
  long_form: 'Long-form',
  short: 'Short',
  explainer: 'Explainer',
  tutorial: 'Tutorial',
  story: 'Story',
  interview_style: 'Interview-style',
  listicle: 'Listicle',
  case_study: 'Case study',
};

export interface PublishingCadence {
  videosPerWeek: number;
  publishDays: Weekday[];
  /** Local publish time in the channel's timezone, `HH:mm`. */
  publishTime: string;
}

export type SourceType =
  | 'article'
  | 'report'
  | 'documentation'
  | 'video'
  | 'book'
  | 'dataset'
  | 'interview'
  | 'official_site';

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  article: 'Article',
  report: 'Report',
  documentation: 'Documentation',
  video: 'Video',
  book: 'Book',
  dataset: 'Dataset',
  interview: 'Interview',
  official_site: 'Official site',
};

/** A research domain an editor has pre-approved for this channel. */
export interface ApprovedSource {
  id: string;
  label: string;
  url: string;
  type: SourceType;
  /** Editor confidence in the source, shown as a badge. */
  credibility: 'high' | 'medium' | 'low';
  addedOn: IsoDate;
  notes?: string;
}

export type VoiceRole = 'narrator' | 'host' | 'character' | 'explainer';

export const VOICE_ROLE_LABELS: Record<VoiceRole, string> = {
  narrator: 'Narrator',
  host: 'Host',
  character: 'Character',
  explainer: 'Explainer',
};

/**
 * Voice slots are configuration only. No provider is connected in this phase,
 * so `providerVoiceId` is always null and `status` stays `placeholder`.
 */
export interface VoiceProfile {
  id: string;
  name: string;
  role: VoiceRole;
  language: LanguageCode;
  /** Plain-language description of the intended delivery. */
  characteristics: string;
  provider: 'elevenlabs' | 'unassigned';
  providerVoiceId: string | null;
  status: 'placeholder' | 'mapped';
}

export interface ChannelBranding {
  /** Hex colour used for calendar chips, chart series and channel avatars. */
  accentColor: string;
  /** Two-letter monogram used in place of a real logo file. */
  monogram: string;
  thumbnailStyle: string;
  titleTypography: string;
  lowerThirdStyle: string;
  musicDirection: string;
}

/**
 * Placeholder for the real YouTube link-up. Nothing here is authenticated;
 * `state` is always `not_connected` until the Integrations work lands.
 */
export interface YouTubeConnection {
  state: 'not_connected';
  /** Intended handle, recorded as configuration only. */
  intendedHandle: string;
  lastCheckedAt: null;
}

export interface ChannelConfig {
  audience: string;
  tone: string;
  languages: LanguageCode[];
  primaryLanguage: LanguageCode;
  preferredFormats: VideoFormat[];
  targetDurationMinutes: { min: number; max: number };
  cadence: PublishingCadence;
  monthlyBudget: number;
  currency: CurrencyCode;
  approvedSources: ApprovedSource[];
  editorialRules: string[];
}

export interface Channel {
  id: string;
  slug: string;
  name: string;
  niche: string;
  description: string;
  status: ChannelStatus;
  audienceRating: AudienceRating;
  monetised: boolean;
  timezone: string;
  createdOn: IsoDate;
  subscribers: number;
  config: ChannelConfig;
  branding: ChannelBranding;
  voices: VoiceProfile[];
  youtube: YouTubeConnection;
}

/** A backlog idea attached to a channel but not yet promoted to a project. */
export interface ContentIdea {
  id: string;
  channelId: string;
  title: string;
  angle: string;
  format: VideoFormat;
  languages: LanguageCode[];
  /** Editor's 1–5 confidence that this is worth producing. */
  confidence: number;
  createdOn: IsoDate;
  source?: string;
}
