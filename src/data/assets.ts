import type { Asset, AssetLicence, LanguageCode, VideoProject } from '@/types';
import { CHANNELS, CHANNELS_BY_ID } from './channels';
import { STAGE_INDEX } from './project-builder';
import { addDays } from '@/lib/date';
import { hashString, seededRandom } from '@/lib/utils';

/**
 * Sample assets for the library. Nothing is fetched: every record is a
 * locally described stand-in with `placeholder: true`, and the library draws a
 * generated preview from the channel's accent colour rather than a real file.
 */

const IMAGE_LICENCES: AssetLicence[] = [
  { type: 'cc0', source: 'Public-domain sample set', sourceUrl: 'https://creativecommons.org/public-domain/cc0/', attribution: null },
  { type: 'cc_by', source: 'Creative Commons sample set', sourceUrl: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Sample author, CC BY 4.0' },
  { type: 'stock_licensed', source: 'Stock licence (placeholder record)', sourceUrl: null, attribution: null },
  { type: 'rights_pending', source: 'Awaiting rights confirmation', sourceUrl: null, attribution: null },
];

const INTERNAL: AssetLicence = {
  type: 'internal',
  source: 'Produced in-house',
  sourceUrl: null,
  attribution: null,
};

const MUSIC: AssetLicence = {
  type: 'royalty_free',
  source: 'Royalty-free music bed (placeholder record)',
  sourceUrl: null,
  attribution: 'Library track, cleared for use',
};

function shortTitle(title: string, words = 5): string {
  return title.split(/\s+/).slice(0, words).join(' ');
}

/** Assets for one project, gated by how far the project has actually got. */
function projectAssets(project: VideoProject): Asset[] {
  const channel = CHANNELS_BY_ID[project.channelId];
  const random = seededRandom(hashString(`assets_${project.id}`));
  const stage = STAGE_INDEX[project.stage];
  const assets: Asset[] = [];
  const created = project.dueDate;
  const label = shortTitle(project.title);

  if (stage >= STAGE_INDEX.script) {
    project.languages.forEach((language: LanguageCode) => {
      assets.push({
        id: `as_${project.id}_script_${language}`,
        name: `${label} — script (${language.toUpperCase()})`,
        type: 'script',
        channelId: project.channelId,
        projectId: project.id,
        language,
        fileFormat: 'md',
        sizeKb: Math.round(8 + random() * 26),
        durationSeconds: null,
        dimensions: null,
        licence: INTERNAL,
        tags: ['script', language === 'hi' ? 'hindi' : 'english', channel.slug],
        createdOn: addDays(created, -12),
        placeholder: true,
      });
    });
  }

  if (stage >= STAGE_INDEX.audio) {
    project.languages.forEach((language: LanguageCode) => {
      assets.push({
        id: `as_${project.id}_vo_${language}`,
        name: `${label} — voice track (${language.toUpperCase()})`,
        type: 'audio',
        channelId: project.channelId,
        projectId: project.id,
        language,
        fileFormat: 'wav',
        sizeKb: Math.round(project.targetDurationMinutes * 9800 * (0.9 + random() * 0.2)),
        durationSeconds: Math.round(project.targetDurationMinutes * 60 * (0.94 + random() * 0.1)),
        dimensions: null,
        licence: INTERNAL,
        tags: ['voice-over', 'placeholder', channel.slug],
        createdOn: addDays(created, -9),
        placeholder: true,
      });
    });
  }

  if (stage >= STAGE_INDEX.visuals) {
    assets.push({
      id: `as_${project.id}_thumb`,
      name: `${label} — thumbnail`,
      type: 'thumbnail',
      channelId: project.channelId,
      projectId: project.id,
      language: channel.config.primaryLanguage,
      fileFormat: 'png',
      sizeKb: Math.round(180 + random() * 320),
      durationSeconds: null,
      dimensions: { width: 1280, height: 720 },
      licence: INTERNAL,
      tags: ['thumbnail', '16:9', channel.slug],
      createdOn: addDays(created, -6),
      placeholder: true,
    });

    const imageCount = 2 + Math.floor(random() * 3);
    for (let index = 0; index < imageCount; index += 1) {
      assets.push({
        id: `as_${project.id}_img_${index + 1}`,
        name: `${label} — still ${index + 1}`,
        type: 'image',
        channelId: project.channelId,
        projectId: project.id,
        language: null,
        fileFormat: 'png',
        sizeKb: Math.round(420 + random() * 900),
        durationSeconds: null,
        dimensions: { width: 1920, height: 1080 },
        licence: IMAGE_LICENCES[Math.floor(random() * IMAGE_LICENCES.length)],
        tags: ['still', 'b-roll', channel.slug],
        createdOn: addDays(created, -5),
        placeholder: true,
      });
    }
  }

  if (stage >= STAGE_INDEX.editing) {
    assets.push({
      id: `as_${project.id}_master`,
      name: `${label} — master cut`,
      type: 'video',
      channelId: project.channelId,
      projectId: project.id,
      language: channel.config.primaryLanguage,
      fileFormat: 'mp4',
      sizeKb: Math.round(project.targetDurationMinutes * 42000 * (0.9 + random() * 0.25)),
      durationSeconds: Math.round(project.targetDurationMinutes * 60),
      dimensions: { width: 1920, height: 1080 },
      licence: INTERNAL,
      tags: ['master', '1080p', channel.slug],
      createdOn: addDays(created, -2),
      placeholder: true,
    });
  }

  return assets;
}

/** Brand-level assets that belong to a channel rather than a single project. */
function channelAssets(): Asset[] {
  return CHANNELS.flatMap((channel) => {
    const random = seededRandom(hashString(`brand_${channel.id}`));
    return [
      {
        id: `as_${channel.id}_logo`,
        name: `${channel.name} — logo lockup`,
        type: 'image' as const,
        channelId: channel.id,
        projectId: null,
        language: null,
        fileFormat: 'svg',
        sizeKb: Math.round(12 + random() * 40),
        durationSeconds: null,
        dimensions: { width: 1024, height: 1024 },
        licence: INTERNAL,
        tags: ['branding', 'logo', channel.slug],
        createdOn: channel.createdOn,
        placeholder: true as const,
      },
      {
        id: `as_${channel.id}_endcard`,
        name: `${channel.name} — end card`,
        type: 'image' as const,
        channelId: channel.id,
        projectId: null,
        language: null,
        fileFormat: 'png',
        sizeKb: Math.round(240 + random() * 300),
        durationSeconds: null,
        dimensions: { width: 1920, height: 1080 },
        licence: INTERNAL,
        tags: ['branding', 'end card', channel.slug],
        createdOn: addDays(channel.createdOn, 4),
        placeholder: true as const,
      },
      {
        id: `as_${channel.id}_music`,
        name: `${channel.name} — theme bed`,
        type: 'audio' as const,
        channelId: channel.id,
        projectId: null,
        language: null,
        fileFormat: 'mp3',
        sizeKb: Math.round(2400 + random() * 1800),
        durationSeconds: Math.round(45 + random() * 60),
        dimensions: null,
        licence: MUSIC,
        tags: ['music', 'theme', channel.slug],
        createdOn: addDays(channel.createdOn, 9),
        placeholder: true as const,
      },
    ];
  });
}

/** Assets are only built for hand-seeded projects; the archive has none. */
export function buildAssets(projects: VideoProject[]): Asset[] {
  return [...channelAssets(), ...projects.flatMap(projectAssets)];
}
