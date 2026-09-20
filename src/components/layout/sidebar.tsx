import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Settings,
  Tv,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/ui';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Matches nested routes, e.g. /channels/ai-for-small-businesses. */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/channels', label: 'Channels', icon: Tv },
  { to: '/pipeline', label: 'Content Pipeline', icon: KanbanSquare },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/assets', label: 'Asset Library', icon: FolderOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main" className="flex-1 space-y-0.5 px-2 py-3">
      {NAV_ITEMS.map((item) => {
        const link = (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
          </NavLink>
        );

        return collapsed ? (
          <InfoTip key={item.to} label={item.label}>
            {link}
          </InfoTip>
        ) : (
          link
        );
      })}
    </nav>
  );
}

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 px-4 py-4', collapsed && 'justify-center px-0')}>
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-white"
      >
        N
      </span>
      <span className={cn('min-w-0', collapsed && 'sr-only')}>
        <span className="block truncate text-sm font-semibold text-white">NovaStudio</span>
        <span className="block truncate text-2xs text-sidebar-muted">Channel operations</span>
      </span>
    </div>
  );
}

export function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className={cn(collapsed && 'sr-only')}>Collapse</span>
    </button>
  );
}
