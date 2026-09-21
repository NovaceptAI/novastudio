import type {
  Asset,
  Channel,
  ChannelConfig,
  ContentIdea,
  Integration,
  IsoDate,
  NewProjectInput,
  PipelineStage,
  VideoProject,
  WorkspaceSettings,
} from '@/types';
import { emptyWorkspace, type WorkspaceData } from '@/data';
import { clearPersisted, dropLegacyStorage, readPersisted, writePersisted } from './storage';
import { isoDateTime, today } from '@/lib/date';
import { createId } from '@/lib/utils';

/**
 * The service layer.
 *
 * Every screen talks to this module and nothing else, so swapping it for real
 * HTTP calls is a change here and nowhere in the UI: each function already
 * returns a promise, takes plain arguments and returns plain domain objects.
 *
 * Until then, state lives in memory and is mirrored into localStorage.
 */

/** What is persisted, and what an export file contains. */
export interface PersistedState {
  channels: Channel[];
  projects: VideoProject[];
  ideas: ContentIdea[];
  assets: Asset[];
  settings: WorkspaceSettings;
}

let state: WorkspaceData | null = null;

/** Stands in for network latency so loading states are real, not theoretical. */
function latency<T>(value: T, ms = 140): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), ms));
}

function hydrate(): WorkspaceData {
  if (state) return state;
  dropLegacyStorage();
  const fresh = emptyWorkspace();
  const persisted = readPersisted<PersistedState>();

  state = persisted
    ? {
        ...fresh,
        channels: persisted.channels ?? fresh.channels,
        projects: persisted.projects ?? [],
        ideas: persisted.ideas ?? [],
        assets: persisted.assets ?? [],
        settings: { ...fresh.settings, ...persisted.settings },
      }
    : fresh;
  return state;
}

function persist(): void {
  const current = hydrate();
  writePersisted<PersistedState>({
    channels: current.channels,
    projects: current.projects,
    ideas: current.ideas,
    assets: current.assets,
    settings: current.settings,
  });
}

/* ------------------------------------------------------------- snapshot */

export interface Snapshot {
  channels: Channel[];
  projects: VideoProject[];
  ideas: ContentIdea[];
  assets: Asset[];
  integrations: Integration[];
  settings: WorkspaceSettings;
}

export async function fetchSnapshot(): Promise<Snapshot> {
  const current = hydrate();
  return latency({ ...current }, 220);
}

/* -------------------------------------------------------------- channels */

export async function updateChannel(channelId: string, patch: Partial<Channel>): Promise<Channel> {
  const current = hydrate();
  const index = current.channels.findIndex((channel) => channel.id === channelId);
  if (index === -1) throw new Error(`Channel ${channelId} was not found`);

  const updated: Channel = { ...current.channels[index], ...patch };
  current.channels = current.channels.map((channel, i) => (i === index ? updated : channel));
  persist();
  return latency(updated);
}

export async function updateChannelConfig(
  channelId: string,
  patch: Partial<ChannelConfig>,
): Promise<Channel> {
  const current = hydrate();
  const channel = current.channels.find((item) => item.id === channelId);
  if (!channel) throw new Error(`Channel ${channelId} was not found`);
  return updateChannel(channelId, { config: { ...channel.config, ...patch } });
}

/* -------------------------------------------------------------- projects */

function touch(project: VideoProject, actor: string, message: string): VideoProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    activity: [
      { id: createId('act'), at: new Date().toISOString(), actor, message },
      ...project.activity,
    ].slice(0, 40),
  };
}

export async function updateProject(
  projectId: string,
  patch: Partial<VideoProject>,
  activityMessage?: string,
): Promise<VideoProject> {
  const current = hydrate();
  const existing = current.projects.find((project) => project.id === projectId);
  if (!existing) throw new Error(`Project ${projectId} was not found`);

  let updated: VideoProject = { ...existing, ...patch };
  if (activityMessage) updated = touch(updated, 'You', activityMessage);
  else updated = { ...updated, updatedAt: new Date().toISOString() };

  current.projects = current.projects.map((project) => (project.id === projectId ? updated : project));
  persist();
  return latency(updated);
}

export class StageChangeError extends Error {}

/**
 * Moves a project between stages. This only changes a record: no media is
 * generated and nothing is uploaded anywhere.
 */
export async function changeStage(projectId: string, stage: PipelineStage): Promise<VideoProject> {
  const current = hydrate();
  const project = current.projects.find((item) => item.id === projectId);
  if (!project) throw new Error(`Project ${projectId} was not found`);

  const settings = current.settings;
  if (stage === 'scheduled' && settings.requireReviewBeforeScheduling && project.review.decision !== 'approved') {
    throw new StageChangeError(
      'Review sign-off is required before scheduling. Approve it on the Review tab, or turn the requirement off in Settings.',
    );
  }
  if (stage === 'scheduled' && settings.requireSourceVerification) {
    const unverified = project.research.filter((record) => !record.verifiedOn);
    if (unverified.length > 0) {
      throw new StageChangeError(
        `${unverified.length} research source${unverified.length > 1 ? 's have' : ' has'} no verification date. Verify them on the Research tab, or turn the requirement off in Settings.`,
      );
    }
  }

  const channel = current.channels.find((item) => item.id === project.channelId);
  const publishTime = channel?.config.cadence.publishTime ?? '18:00';

  const publishing = { ...project.publishing };
  if (stage === 'scheduled' && !publishing.scheduledFor) {
    publishing.scheduledFor = isoDateTime(project.dueDate, publishTime);
  }
  if (stage === 'published' && !publishing.publishedAt) {
    publishing.publishedAt = isoDateTime(today(), publishTime);
    publishing.scheduledFor = publishing.scheduledFor ?? publishing.publishedAt;
  }
  if (stage !== 'published') publishing.publishedAt = null;
  if (stage !== 'scheduled' && stage !== 'published') publishing.scheduledFor = null;

  return updateProject(
    projectId,
    { stage, publishing },
    `Stage changed to ${stage} (local change only — no media was generated).`,
  );
}

export async function rescheduleProject(projectId: string, date: IsoDate): Promise<VideoProject> {
  const current = hydrate();
  const project = current.projects.find((item) => item.id === projectId);
  if (!project) throw new Error(`Project ${projectId} was not found`);

  const channel = current.channels.find((item) => item.id === project.channelId);
  const time = channel?.config.cadence.publishTime ?? '18:00';
  const slot = isoDateTime(date, time);
  const published = project.stage === 'published';

  return updateProject(
    projectId,
    {
      dueDate: date,
      publishing: {
        ...project.publishing,
        scheduledFor: slot,
        publishedAt: published ? slot : null,
      },
    },
    `Moved to ${date}.`,
  );
}

export async function createProject(input: NewProjectInput): Promise<VideoProject> {
  const current = hydrate();
  const channel = current.channels.find((item) => item.id === input.channelId);
  if (!channel) throw new Error('Pick a channel before creating a video');

  const now = new Date().toISOString();
  const project: VideoProject = {
    id: createId('pr'),
    channelId: input.channelId,
    title: input.title,
    format: input.format,
    stage: input.stage,
    priority: input.priority,
    languages: input.languages,
    tracks: input.languages.map((language) => ({
      language,
      script: 'not_started',
      audio: 'not_started',
      captions: 'not_started',
      scriptWordCount: 0,
      scriptBody: '',
      publishTitle: language === 'hi' ? `${input.title} (हिंदी)` : input.title,
      publishDescription: '',
      updatedAt: now,
    })),
    targetDurationMinutes: input.targetDurationMinutes,
    dueDate: input.dueDate,
    estimatedCost: input.estimatedCost,
    actualCost: null,
    brief: {
      hook: input.hook,
      summary: input.summary,
      audience: channel.config.audience,
      angle: '',
      keywords: [],
      callToAction: '',
    },
    research: [],
    review: {
      decision: 'pending',
      reviewer: null,
      reviewedAt: null,
      checklist: [
        { id: createId('chk'), label: 'Every factual claim is backed by a verified source', checked: false, required: true },
        { id: createId('chk'), label: 'Script follows the channel editorial rules', checked: false, required: true },
        { id: createId('chk'), label: 'Title and description match the actual content', checked: false, required: true },
        { id: createId('chk'), label: 'All visuals and audio carry a usable licence', checked: false, required: true },
      ],
      notes: '',
    },
    publishing: {
      visibility: channel.audienceRating === 'mature' ? 'unlisted' : 'public',
      playlist: '',
      tags: [],
      scheduledFor: null,
      publishedAt: null,
      youtubeVideoId: null,
      thumbnailAssetId: null,
      madeForKids: channel.audienceRating === 'family',
    },
    assetIds: [],
    blocker: null,
    failure: null,
    activity: [{ id: createId('act'), at: now, actor: 'You', message: 'Project created.' }],
    createdAt: now,
    updatedAt: now,
  };

  current.projects = [project, ...current.projects];
  persist();
  return latency(project);
}

export async function deleteProject(projectId: string): Promise<void> {
  const current = hydrate();
  current.projects = current.projects.filter((project) => project.id !== projectId);
  current.assets = current.assets.map((asset) =>
    asset.projectId === projectId ? { ...asset, projectId: null } : asset,
  );
  persist();
  return latency(undefined);
}

/* ----------------------------------------------------------------- ideas */

export async function promoteIdea(ideaId: string, dueDate: IsoDate): Promise<VideoProject> {
  const current = hydrate();
  const idea = current.ideas.find((item) => item.id === ideaId);
  if (!idea) throw new Error(`Idea ${ideaId} was not found`);

  const channel = current.channels.find((item) => item.id === idea.channelId)!;
  const { min, max } = channel.config.targetDurationMinutes;
  const perVideo =
    channel.config.monthlyBudget && channel.config.cadence.videosPerWeek
      ? Math.round(channel.config.monthlyBudget / (channel.config.cadence.videosPerWeek * 4.33))
      : 0;
  const project = await createProject({
    channelId: idea.channelId,
    title: idea.title,
    format: idea.format,
    languages: idea.languages,
    targetDurationMinutes: max ? Math.round((min + max) / 2) : 10,
    priority: 'normal',
    dueDate,
    estimatedCost: perVideo,
    stage: 'idea',
    hook: idea.angle,
    summary: idea.title,
  });

  current.ideas = current.ideas.filter((item) => item.id !== ideaId);
  persist();
  return project;
}

export async function addIdea(idea: Omit<ContentIdea, 'id' | 'createdOn'>): Promise<ContentIdea> {
  const current = hydrate();
  const created: ContentIdea = { ...idea, id: createId('id'), createdOn: today() };
  current.ideas = [created, ...current.ideas];
  persist();
  return latency(created);
}

/* -------------------------------------------------------------- settings */

export async function updateSettings(patch: Partial<WorkspaceSettings>): Promise<WorkspaceSettings> {
  const current = hydrate();
  current.settings = { ...current.settings, ...patch };
  persist();
  return latency(current.settings);
}

/* ---------------------------------------------------------------- assets */

export async function addAsset(asset: Omit<Asset, 'id' | 'createdOn' | 'placeholder'>): Promise<Asset> {
  const current = hydrate();
  const created: Asset = { ...asset, id: createId('as'), createdOn: today(), placeholder: true };
  current.assets = [created, ...current.assets];
  if (created.projectId) {
    current.projects = current.projects.map((project) =>
      project.id === created.projectId
        ? { ...project, assetIds: [...project.assetIds, created.id] }
        : project,
    );
  }
  persist();
  return latency(created);
}

export async function deleteAsset(assetId: string): Promise<void> {
  const current = hydrate();
  current.assets = current.assets.filter((asset) => asset.id !== assetId);
  current.projects = current.projects.map((project) => ({
    ...project,
    assetIds: project.assetIds.filter((id) => id !== assetId),
  }));
  persist();
  return latency(undefined);
}

/* ------------------------------------------------------------ workspace */

/** Everything a backup file needs to restore this workspace elsewhere. */
export function exportWorkspace(): PersistedState {
  const current = hydrate();
  return {
    channels: current.channels,
    projects: current.projects,
    ideas: current.ideas,
    assets: current.assets,
    settings: current.settings,
  };
}

export async function importWorkspace(data: PersistedState): Promise<Snapshot> {
  if (!Array.isArray(data?.channels) || !Array.isArray(data?.projects)) {
    throw new Error('That file is not a NovaStudio export.');
  }
  const fresh = emptyWorkspace();
  state = {
    ...fresh,
    channels: data.channels,
    projects: data.projects,
    ideas: data.ideas ?? [],
    assets: data.assets ?? [],
    settings: { ...fresh.settings, ...data.settings },
  };
  persist();
  return latency({ ...state });
}

/** Deletes every video, idea, asset and setting, and restores blank channels. */
export async function clearAllData(): Promise<Snapshot> {
  clearPersisted();
  state = null;
  const fresh = hydrate();
  return latency({ ...fresh }, 200);
}
