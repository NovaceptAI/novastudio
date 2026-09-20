import type { IsoDate, LanguageCode, VideoProject } from '@/types';
import { CHANNELS } from './channels';
import { buildProject, type ProjectSeed } from './project-builder';
import { DEMO_TODAY, addDays, diffInDays, weekdayOf } from '@/lib/date';
import { hashString, seededRandom } from '@/lib/utils';

/**
 * Videos that already went out, generated across the previous 12 weeks so the
 * analytics, the calendar and each channel's recent-videos list have history.
 *
 * These deliberately land below the configured cadence: cadence is the plan,
 * the archive is what actually shipped, and the Overview surfaces the gap as
 * something needing attention rather than hiding it.
 */

const ARCHIVE_WINDOW_DAYS = 84;

const ARCHIVE_TITLES: Record<string, string[]> = {
  ch_ai_smb: [
    'Three AI tools we stopped recommending this quarter',
    'Your invoices are a database: querying them without a developer',
    'The meeting-notes workflow that survived six months',
    'What "unlimited" means on an AI subscription',
    'Automating WhatsApp enquiries without annoying anyone',
    'A one-page AI policy for a twelve-person company',
    'Vendor demos: the four questions that end them early',
    'Why your chatbot answers the wrong question',
  ],
  ch_office: [
    'VLOOKUP is fine. Here is when it is not',
    'The meeting you should have declined, and how',
    'Conditional formatting for people who hate colour',
    'Writing a handover that your replacement can use',
    'Three ways to say no to your manager and keep the room',
    'Keyboard-only navigation in Excel: the full route',
    'How to run a stand-up in eleven minutes',
    'The appraisal document you should be writing all year',
  ],
  ch_english: [
    'Past continuous: four sentences you already think in Hindi',
    'Restaurant English: ordering, asking, complaining politely',
    'The TH sound, drilled twelve times',
    'Since or for? A ten-second rule',
    'Small talk at work: eight openings that are not the weather',
    'Prepositions of place: in, on, at, finally sorted',
    'Saying no in English without sounding rude',
    'Numbers, dates and money spoken correctly',
  ],
  ch_brands: [
    'The retailer that expanded into insolvency',
    'A family business, three succession plans, one court order',
    'What a ten-year price war did to both sides',
    'The brand that survived by shrinking',
    'How a licensing deal outlived the company that signed it',
    'The factory that was worth more than the product',
    'Two mergers, one regulator, and a decade of conditions',
    'The advertisement that changed the category',
  ],
  ch_growth: [
    'The planning fallacy, with the original study',
    'Why deadlines move and estimates do not',
    'Attention residue: what switching actually leaves behind',
    'Motivation is a consequence, not a prerequisite',
    'Three reasons a habit fails that are not willpower',
    'The difference between a value and a goal',
    'What sleep research says about morning routines',
    'Decision fatigue: the evidence and the overreach',
  ],
  ch_relationships: [
    'Attachment styles: what the research supports',
    'Household labour and the fairness gap',
    'Talking about money without escalation',
    'What long-term couples report about intimacy over time',
    'Jealousy: the clinical picture',
    'Boundaries with extended family, practically',
    'Sexual communication: the phrases clinicians suggest',
    'When to bring in a therapist, and how to choose one',
  ],
  ch_cricket: [
    'The yorker is not the best death ball any more',
    'Spin in the powerplay: the numbers by surface',
    'Why the third-man region decides T20 games',
    'Reading a pitch report that actually predicts',
    'The DRS umpire’s-call debate, diagrammed',
    'How teams pick which bowler faces the left-hander',
    'Batting depth versus bowling options: the trade in numbers',
    'Reverse swing: conditions, not conspiracy',
  ],
  ch_pets: [
    'The myth of the alpha dog, and where it came from',
    'Why your cat brings you things',
    'Separation distress: the signs before the damage',
    'Food guarding, handled without confrontation',
    'What tail wagging actually encodes',
    'Monsoon paw care for Indian cities',
    'Litter box refusal is a medical question first',
    'Teaching recall to a dog that has never had it',
  ],
  ch_mystery: [
    'पुराना डाकघर — एपिसोड 1',
    'पुराना डाकघर — एपिसोड 2',
    'पुराना डाकघर — एपिसोड 3',
    'पुराना डाकघर — एपिसोड 4',
    'पुराना डाकघर — एपिसोड 5',
    'पुराना डाकघर — एपिसोड 6',
    'एक रात की कहानी: छत पर कोई था',
    'एक रात की कहानी: आख़िरी ट्रेन',
  ],
  ch_kids: [
    'Tumbletail Finds a Feather',
    'Boru and the Rainy Afternoon',
    'The Berry Nobody Wanted',
    'Tumbletail Says Goodnight',
  ],
};

/** Publish slots on the channel's cadence days, spread across the window. */
function archiveSlots(channelId: string, count: number): IsoDate[] {
  const channel = CHANNELS.find((item) => item.id === channelId);
  if (!channel || count === 0) return [];

  const candidates: IsoDate[] = [];
  for (let offset = ARCHIVE_WINDOW_DAYS; offset >= 2; offset -= 1) {
    const date = addDays(DEMO_TODAY, -offset);
    if (channel.config.cadence.publishDays.includes(weekdayOf(date))) candidates.push(date);
  }
  if (candidates.length <= count) return candidates;

  const step = candidates.length / count;
  return Array.from({ length: count }, (_, index) => candidates[Math.floor(index * step)]);
}

function archiveSeed(
  channelId: string,
  title: string,
  slot: IsoDate,
  index: number,
  random: () => number,
): ProjectSeed {
  const channel = CHANNELS.find((item) => item.id === channelId)!;
  const { min, max } = channel.config.targetDurationMinutes;
  const duration = Math.round(min + random() * (max - min));
  const languages: LanguageCode[] = channel.config.languages;
  const dueInDays = diffInDays(DEMO_TODAY, slot);

  return {
    id: `pr_arch_${channelId.replace('ch_', '')}_${index + 1}`,
    channelId,
    title,
    format: channel.config.preferredFormats[index % channel.config.preferredFormats.length],
    stage: 'published',
    priority: 'normal',
    languages,
    durationMinutes: duration,
    dueInDays,
    slotInDays: dueInDays,
    estimatedCost: Math.round(
      (channel.config.monthlyBudget / (channel.config.cadence.videosPerWeek * 4.33)) *
        (0.85 + random() * 0.3),
    ),
    playlist: 'Archive',
    hook: `${title}.`,
    summary: `Published to ${channel.name}. Part of the seeded back catalogue that gives the analytics and calendar their history.`,
    angle: channel.config.tone,
    keywords: channel.niche.toLowerCase().split(' · '),
    callToAction: 'Sample back-catalogue entry — demo data.',
  };
}

export function buildArchiveProjects(): VideoProject[] {
  const projects: VideoProject[] = [];
  for (const channel of CHANNELS) {
    const titles = ARCHIVE_TITLES[channel.id] ?? [];
    const slots = archiveSlots(channel.id, titles.length);
    const random = seededRandom(hashString(`archive_${channel.id}`));
    slots.forEach((slot, index) => {
      projects.push(buildProject(archiveSeed(channel.id, titles[index], slot, index, random), DEMO_TODAY));
    });
  }
  return projects;
}
