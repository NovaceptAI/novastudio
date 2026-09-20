import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Check, ChevronDown, Menu, Plus, X } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ErrorState,
  LoadingState,
  TooltipProvider,
} from '@/components/ui';
import { ChannelAvatar } from '@/components/common';
import { useData, useFilters } from '@/store/app-store';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';
import { GlobalSearch } from './global-search';
import { SidebarBrand, SidebarNav, SidebarToggle } from './sidebar';
import { cn } from '@/lib/utils';

/** Global channel selector. Every screen reads the same selection. */
function ChannelSelector() {
  const { snapshot } = useData();
  const { channelId, setChannelId } = useFilters();
  const channels = snapshot?.channels ?? [];
  const selected = channels.find((channel) => channel.id === channelId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="md" className="min-w-0 max-w-56 justify-between">
          <span className="flex min-w-0 items-center gap-2">
            {selected ? (
              <ChannelAvatar channel={selected} size="sm" />
            ) : (
              <span aria-hidden className="grid size-6 place-items-center rounded-md bg-subtle text-2xs font-semibold text-muted-foreground">
                All
              </span>
            )}
            <span className="truncate text-sm">{selected ? selected.name : 'All channels'}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-96 w-72 overflow-y-auto">
        <DropdownMenuLabel>Channel</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setChannelId('all')}>
          <span className="flex-1">All channels</span>
          {channelId === 'all' && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {channels.map((channel) => (
          <DropdownMenuItem key={channel.id} onSelect={() => setChannelId(channel.id)}>
            <ChannelAvatar channel={channel} size="sm" />
            <span className="min-w-0 flex-1 truncate">{channel.name}</span>
            {channelId === channel.id && <Check className="size-3.5 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell() {
  const { loading, error, snapshot, reload } = useData();
  const { channelId } = useFilters();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  // Lock scrolling behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-canvas">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-pop"
        >
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <aside
          className={cn(
            'sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <SidebarBrand collapsed={collapsed} />
          <SidebarNav collapsed={collapsed} />
          <div className="border-t border-white/5 p-2">
            <SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-foreground/30"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-64 animate-slide-in-right flex-col bg-sidebar">
              <div className="flex items-center justify-between pr-2">
                <SidebarBrand collapsed={false} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-canvas/85 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu />
              </Button>

              {snapshot && <ChannelSelector />}

              <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
                {snapshot && <GlobalSearch />}
              </div>

              <Button
                variant="primary"
                size="md"
                className="ml-auto sm:ml-0"
                onClick={() => setNewOpen(true)}
                disabled={!snapshot}
              >
                <Plus />
                <span className="hidden sm:inline">New Video</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
            {loading && !snapshot ? (
              <LoadingState label="Loading workspace…" />
            ) : error ? (
              <ErrorState
                title="The workspace could not be loaded"
                message={error}
                onRetry={() => void reload()}
              />
            ) : (
              <Outlet />
            )}
          </main>
        </div>

        {snapshot && (
          <NewProjectDialog
            open={newOpen}
            onOpenChange={setNewOpen}
            defaultChannelId={channelId === 'all' ? undefined : channelId}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
