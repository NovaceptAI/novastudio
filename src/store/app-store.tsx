import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  Channel,
  ChannelConfig,
  ContentIdea,
  DateRange,
  IsoDate,
  NewProjectInput,
  PipelineStage,
  VideoProject,
  WorkspaceSettings,
} from '@/types';
import * as api from '@/services/api';
import type { Snapshot } from '@/services/api';
import { persistedSavedAt } from '@/services/storage';
import { DEMO_TODAY, rangeOfLastDays } from '@/lib/date';

/**
 * One provider holds the loaded snapshot and the mutations; a second holds the
 * global filter state (channel, date range, search) that the top bar drives and
 * most screens read. Splitting them keeps a filter change from re-running the
 * data effects.
 */

interface DataContextValue {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
  /** When local edits were last written to localStorage. */
  savedAt: string | null;
  reload: () => Promise<void>;
  resetDemo: () => Promise<void>;
  createProject: (input: NewProjectInput) => Promise<VideoProject>;
  updateProject: (id: string, patch: Partial<VideoProject>, message?: string) => Promise<VideoProject>;
  changeStage: (id: string, stage: PipelineStage) => Promise<VideoProject>;
  rescheduleProject: (id: string, date: IsoDate) => Promise<VideoProject>;
  deleteProject: (id: string) => Promise<void>;
  updateChannel: (id: string, patch: Partial<Channel>) => Promise<Channel>;
  updateChannelConfig: (id: string, patch: Partial<ChannelConfig>) => Promise<Channel>;
  promoteIdea: (ideaId: string, dueDate: IsoDate) => Promise<VideoProject>;
  addIdea: (idea: Omit<ContentIdea, 'id' | 'createdOn'>) => Promise<ContentIdea>;
  updateSettings: (patch: Partial<WorkspaceSettings>) => Promise<WorkspaceSettings>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await api.fetchSnapshot());
      setSavedAt(persistedSavedAt());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The demo data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Replaces one project in place so screens do not need a full refetch. */
  const mergeProject = useCallback((project: VideoProject) => {
    setSnapshot((current) => {
      if (!current) return current;
      const exists = current.projects.some((item) => item.id === project.id);
      return {
        ...current,
        projects: exists
          ? current.projects.map((item) => (item.id === project.id ? project : item))
          : [project, ...current.projects],
      };
    });
    setSavedAt(persistedSavedAt());
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      snapshot,
      loading,
      error,
      savedAt,
      reload: load,
      resetDemo: async () => {
        setLoading(true);
        try {
          setSnapshot(await api.resetDemoData());
          setSavedAt(null);
          setError(null);
        } finally {
          setLoading(false);
        }
      },
      createProject: async (input) => {
        const project = await api.createProject(input);
        mergeProject(project);
        return project;
      },
      updateProject: async (id, patch, message) => {
        const project = await api.updateProject(id, patch, message);
        mergeProject(project);
        return project;
      },
      changeStage: async (id, stage) => {
        const project = await api.changeStage(id, stage);
        mergeProject(project);
        return project;
      },
      rescheduleProject: async (id, date) => {
        const project = await api.rescheduleProject(id, date);
        mergeProject(project);
        return project;
      },
      deleteProject: async (id) => {
        await api.deleteProject(id);
        setSnapshot((current) =>
          current ? { ...current, projects: current.projects.filter((item) => item.id !== id) } : current,
        );
        setSavedAt(persistedSavedAt());
      },
      updateChannel: async (id, patch) => {
        const channel = await api.updateChannel(id, patch);
        setSnapshot((current) =>
          current
            ? { ...current, channels: current.channels.map((item) => (item.id === id ? channel : item)) }
            : current,
        );
        setSavedAt(persistedSavedAt());
        return channel;
      },
      updateChannelConfig: async (id, patch) => {
        const channel = await api.updateChannelConfig(id, patch);
        setSnapshot((current) =>
          current
            ? { ...current, channels: current.channels.map((item) => (item.id === id ? channel : item)) }
            : current,
        );
        setSavedAt(persistedSavedAt());
        return channel;
      },
      promoteIdea: async (ideaId, dueDate) => {
        const project = await api.promoteIdea(ideaId, dueDate);
        setSnapshot((current) =>
          current
            ? {
                ...current,
                projects: [project, ...current.projects],
                ideas: current.ideas.filter((item) => item.id !== ideaId),
              }
            : current,
        );
        setSavedAt(persistedSavedAt());
        return project;
      },
      addIdea: async (idea) => {
        const created = await api.addIdea(idea);
        setSnapshot((current) => (current ? { ...current, ideas: [created, ...current.ideas] } : current));
        setSavedAt(persistedSavedAt());
        return created;
      },
      updateSettings: async (patch) => {
        const settings = await api.updateSettings(patch);
        setSnapshot((current) => (current ? { ...current, settings } : current));
        setSavedAt(persistedSavedAt());
        return settings;
      },
    }),
    [snapshot, loading, error, savedAt, load, mergeProject],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* --------------------------------------------------------------- filters */

export const DATE_PRESETS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
] as const;

interface FiltersContextValue {
  /** `all` means every channel; otherwise a single channel id. */
  channelId: string;
  setChannelId: (value: string) => void;
  rangeDays: number;
  setRangeDays: (value: number) => void;
  range: DateRange;
  search: string;
  setSearch: (value: string) => void;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [channelId, setChannelId] = useState('all');
  const [rangeDays, setRangeDays] = useState(30);
  const [search, setSearch] = useState('');

  const value = useMemo<FiltersContextValue>(
    () => ({
      channelId,
      setChannelId,
      rangeDays,
      setRangeDays,
      range: rangeOfLastDays(rangeDays, DEMO_TODAY),
      search,
      setSearch,
    }),
    [channelId, rangeDays, search],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

/* ----------------------------------------------------------------- hooks */

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used inside <DataProvider>');
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) throw new Error('useFilters must be used inside <FiltersProvider>');
  return context;
}

/**
 * The loaded snapshot, for screens that render after the shell has confirmed
 * the data is there. Throws if called while still loading.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useSnapshot(): Snapshot {
  const { snapshot } = useData();
  if (!snapshot) throw new Error('useSnapshot was called before the data finished loading');
  return snapshot;
}

/** Channel ids in scope for the current selection. */
// eslint-disable-next-line react-refresh/only-export-components
export function useScopedChannelIds(): string[] {
  const { channels } = useSnapshot();
  const { channelId } = useFilters();
  return useMemo(
    () => (channelId === 'all' ? channels.map((channel) => channel.id) : [channelId]),
    [channels, channelId],
  );
}
