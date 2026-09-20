import type {
  Asset,
  Channel,
  ContentIdea,
  DailyChannelMetrics,
  Integration,
  VideoProject,
  WorkspaceSettings,
} from '@/types';
import { CHANNELS } from './channels';
import { CONTENT_IDEAS } from './ideas';
import { PROJECT_SEEDS } from './project-seeds';
import { buildProject } from './project-builder';
import { buildArchiveProjects } from './archive';
import { buildAssets } from './assets';
import { buildDailyMetrics } from './analytics';
import { DEFAULT_SETTINGS, INTEGRATIONS } from './integrations';
import { DEMO_TODAY } from '@/lib/date';

export interface DemoData {
  channels: Channel[];
  projects: VideoProject[];
  ideas: ContentIdea[];
  assets: Asset[];
  metrics: DailyChannelMetrics[];
  integrations: Integration[];
  settings: WorkspaceSettings;
}

/**
 * Assembles the whole demo data set from the seeds. Deterministic: the same
 * objects come back on every call, which is what keeps the charts, tables and
 * totals agreeing with each other.
 */
export function buildDemoData(): DemoData {
  const seededProjects = PROJECT_SEEDS.map((seed) => buildProject(seed, DEMO_TODAY));
  const assets = buildAssets(seededProjects);

  const assetsByProject = new Map<string, string[]>();
  for (const asset of assets) {
    if (!asset.projectId) continue;
    const list = assetsByProject.get(asset.projectId) ?? [];
    list.push(asset.id);
    assetsByProject.set(asset.projectId, list);
  }

  const projects = [
    ...seededProjects.map((project) => ({
      ...project,
      assetIds: assetsByProject.get(project.id) ?? [],
    })),
    ...buildArchiveProjects(),
  ];

  return {
    channels: CHANNELS,
    projects,
    ideas: CONTENT_IDEAS,
    assets,
    metrics: buildDailyMetrics(projects),
    integrations: INTEGRATIONS,
    settings: DEFAULT_SETTINGS,
  };
}

export { CHANNELS, CONTENT_IDEAS, INTEGRATIONS, DEFAULT_SETTINGS };
export { STAGE_INDEX } from './project-builder';
