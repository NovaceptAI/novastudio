import type {
  Asset,
  Channel,
  ContentIdea,
  Integration,
  VideoProject,
  WorkspaceSettings,
} from '@/types';
import { CHANNELS } from './channels';
import { DEFAULT_SETTINGS, INTEGRATIONS } from './integrations';

export interface WorkspaceData {
  channels: Channel[];
  projects: VideoProject[];
  ideas: ContentIdea[];
  assets: Asset[];
  integrations: Integration[];
  settings: WorkspaceSettings;
}

/**
 * A fresh workspace: the ten channels, and nothing else. No videos, ideas or
 * assets exist until someone adds them.
 */
export function emptyWorkspace(): WorkspaceData {
  return {
    channels: structuredClone(CHANNELS),
    projects: [],
    ideas: [],
    assets: [],
    integrations: INTEGRATIONS,
    settings: { ...DEFAULT_SETTINGS },
  };
}
