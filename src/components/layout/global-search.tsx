import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search, Tv, Video } from 'lucide-react';
import { useSnapshot } from '@/store/app-store';
import { cn, matchesQuery } from '@/lib/utils';
import { ChannelAvatar, StageBadge } from '@/components/common';
import { CHANNELS_BY_ID } from '@/data/channels';

interface Result {
  id: string;
  kind: 'channel' | 'project' | 'asset';
  label: string;
  detail: string;
  to: string;
}

const KIND_ICON = { channel: Tv, project: Video, asset: FolderOpen } as const;

/**
 * Searches channels, projects and assets at once. Arrow keys move through the
 * results and Enter opens the highlighted one, so the whole thing is usable
 * without a mouse.
 */
export function GlobalSearch() {
  const { channels, projects, assets } = useSnapshot();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<Result[]>(() => {
    if (query.trim().length < 2) return [];

    const channelHits: Result[] = channels
      .filter((channel) => matchesQuery(query, channel.name, channel.niche, channel.description))
      .slice(0, 4)
      .map((channel) => ({
        id: channel.id,
        kind: 'channel',
        label: channel.name,
        detail: channel.niche,
        to: `/channels/${channel.slug}`,
      }));

    const projectHits: Result[] = projects
      .filter((project) => matchesQuery(query, project.title, project.brief.summary, project.brief.hook))
      .slice(0, 6)
      .map((project) => ({
        id: project.id,
        kind: 'project',
        label: project.title,
        detail: CHANNELS_BY_ID[project.channelId]?.name ?? 'Unknown channel',
        to: `/pipeline/${project.id}`,
      }));

    const assetHits: Result[] = assets
      .filter((asset) => matchesQuery(query, asset.name, asset.tags.join(' ')))
      .slice(0, 4)
      .map((asset) => ({
        id: asset.id,
        kind: 'asset',
        label: asset.name,
        detail: CHANNELS_BY_ID[asset.channelId]?.name ?? 'Unknown channel',
        to: `/assets?q=${encodeURIComponent(asset.name)}`,
      }));

    return [...channelHits, ...projectHits, ...assetHits];
  }, [query, channels, projects, assets]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // "/" focuses search from anywhere that is not already a text field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function go(result: Result) {
    navigate(result.to);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-label="Search channels, videos and assets"
        placeholder="Search videos, channels, assets…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-9 w-full rounded-lg border border-border-strong bg-card pl-8 pr-10 text-sm placeholder:text-muted-foreground/70 transition-colors hover:border-muted-foreground/40"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border-strong bg-subtle px-1 text-2xs text-muted-foreground sm:block">
        /
      </kbd>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 animate-slide-up overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-pop"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nothing matches “{query}”.
            </p>
          ) : (
            results.map((result, index) => {
              const Icon = KIND_ICON[result.kind];
              const project =
                result.kind === 'project' ? projects.find((item) => item.id === result.id) : undefined;
              const channel =
                result.kind === 'channel' ? channels.find((item) => item.id === result.id) : undefined;
              return (
                <button
                  key={`${result.kind}-${result.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(result)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
                    index === active ? 'bg-subtle' : 'hover:bg-subtle/60',
                  )}
                >
                  {channel ? (
                    <ChannelAvatar channel={channel} size="sm" />
                  ) : (
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{result.label}</span>
                    <span className="block truncate text-2xs text-muted-foreground">{result.detail}</span>
                  </span>
                  {project && <StageBadge stage={project.stage} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
