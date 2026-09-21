import type { AudienceRating, Channel, LanguageCode } from '@/types';

/**
 * The ten channels, as named in the brief. Only what the brief actually says is
 * filled in — the name, the two stated audiences, and the language tracks.
 * Everything else (audience, tone, cadence, budget, sources, rules, branding,
 * voices) starts empty and is set on each channel's Configuration tab.
 *
 * Accent colours and monograms are UI identifiers, not channel data. The colour
 * order was checked for colour-vision separation between neighbours.
 */

interface ChannelSeed {
  id: string;
  slug: string;
  name: string;
  monogram: string;
  accentColor: string;
  audienceRating?: AudienceRating;
  audience?: string;
  languages?: LanguageCode[];
  primaryLanguage?: LanguageCode;
}

const SEEDS: ChannelSeed[] = [
  { id: 'ch_ai_smb', slug: 'ai-for-small-businesses', name: 'AI for Small Businesses', monogram: 'AI', accentColor: '#4f46e5' },
  { id: 'ch_office', slug: 'office-productivity-careers', name: 'Office Productivity & Careers', monogram: 'OP', accentColor: '#d97706' },
  { id: 'ch_english', slug: 'english-for-hindi-speakers', name: 'English for Hindi Speakers', monogram: 'EN', accentColor: '#0d9488', primaryLanguage: 'hi' },
  { id: 'ch_brands', slug: 'business-and-brand-stories', name: 'Business & Brand Stories', monogram: 'BS', accentColor: '#e11d48' },
  { id: 'ch_growth', slug: 'motivation-clarity-personal-growth', name: 'Motivation, Clarity & Personal Growth', monogram: 'MC', accentColor: '#9333ea' },
  {
    id: 'ch_relationships',
    slug: 'relationships-intimacy-compatibility',
    name: 'Relationships, Intimacy & Compatibility',
    monogram: 'RI',
    accentColor: '#16a34a',
    audienceRating: 'mature',
    audience: 'Adult educational audience.',
  },
  { id: 'ch_cricket', slug: 'cricket-explained', name: 'Cricket Explained', monogram: 'CX', accentColor: '#0891b2' },
  { id: 'ch_pets', slug: 'pets-and-animal-behaviour', name: 'Pets & Animal Behaviour', monogram: 'PA', accentColor: '#ea580c' },
  { id: 'ch_mystery', slug: 'original-hindi-mysteries', name: 'Original Hindi Mysteries', monogram: 'HM', accentColor: '#c026d3', languages: ['hi'], primaryLanguage: 'hi' },
  {
    id: 'ch_kids',
    slug: 'tumbletail-kids-tv',
    name: 'Tumbletail Kids TV',
    monogram: 'TT',
    accentColor: '#65a30d',
    audienceRating: 'family',
    audience: 'Children aged 4–7. Talking-animal stories.',
  },
];

function toChannel(seed: ChannelSeed): Channel {
  const languages = seed.languages ?? ['en', 'hi'];
  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    niche: '',
    description: '',
    status: 'setup',
    audienceRating: seed.audienceRating ?? 'general',
    monetised: false,
    timezone: 'Asia/Kolkata',
    createdOn: '',
    subscribers: 0,
    config: {
      audience: seed.audience ?? '',
      tone: '',
      languages,
      primaryLanguage: seed.primaryLanguage ?? languages[0],
      preferredFormats: [],
      targetDurationMinutes: { min: 0, max: 0 },
      cadence: { videosPerWeek: 0, publishDays: [], publishTime: '18:00' },
      monthlyBudget: 0,
      currency: 'INR',
      approvedSources: [],
      editorialRules: [],
    },
    branding: {
      accentColor: seed.accentColor,
      monogram: seed.monogram,
      thumbnailStyle: '',
      titleTypography: '',
      lowerThirdStyle: '',
      musicDirection: '',
    },
    voices: [],
    youtube: { state: 'not_connected', intendedHandle: '', lastCheckedAt: null },
  };
}

export const CHANNELS: Channel[] = SEEDS.map(toChannel);

export const CHANNELS_BY_ID: Record<string, Channel> = Object.fromEntries(
  CHANNELS.map((channel) => [channel.id, channel]),
);

/** What still has to be decided before a channel is ready to produce for. */
export function missingSetup(channel: Channel): string[] {
  const missing: string[] = [];
  if (!channel.config.audience.trim()) missing.push('audience');
  if (!channel.config.tone.trim()) missing.push('tone');
  if (channel.config.preferredFormats.length === 0) missing.push('formats');
  if (channel.config.targetDurationMinutes.max === 0) missing.push('target duration');
  if (channel.config.cadence.videosPerWeek === 0) missing.push('cadence');
  if (channel.config.monthlyBudget === 0) missing.push('budget');
  if (channel.config.approvedSources.length === 0) missing.push('approved sources');
  return missing;
}
