import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useData, useScopedChannelIds, useSnapshot } from '@/store/app-store';
import { Badge, Button, EmptyState, useToast } from '@/components/ui';
import { ChannelDot, DemoDataNotice, PageHeader, StageBadge } from '@/components/common';
import { ChartLegend } from '@/components/charts/chart-kit';
import {
  DEMO_TODAY,
  addDays,
  addMonths,
  endOfMonth,
  formatFullDate,
  formatMonthYear,
  formatWeekday,
  monthGrid,
  parseIsoDate,
  startOfMonth,
  startOfWeek,
} from '@/lib/date';
import { cn } from '@/lib/utils';
import { scopeProjects } from '@/lib/selectors';
import type { IsoDate, VideoProject } from '@/types';
import { WEEKDAY_LABELS, WEEKDAY_VALUES } from '@/types';

type CalendarView = 'month' | 'week';

export function CalendarPage() {
  const { channels, projects, settings } = useSnapshot();
  const { rescheduleProject } = useData();
  const { notify } = useToast();
  const scopedIds = useScopedChannelIds();

  const [view, setView] = useState<CalendarView>('month');
  const [cursor, setCursor] = useState<IsoDate>(DEMO_TODAY);
  const [dragged, setDragged] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<IsoDate | null>(null);

  const scoped = useMemo(() => scopeProjects(projects, scopedIds), [projects, scopedIds]);

  /** Slots are keyed by day so each cell is a single map lookup. */
  const byDay = useMemo(() => {
    const map = new Map<IsoDate, VideoProject[]>();
    for (const project of scoped) {
      const slot = project.publishing.scheduledFor ?? project.publishing.publishedAt;
      if (!slot) continue;
      const day = slot.slice(0, 10);
      const list = map.get(day) ?? [];
      list.push(project);
      map.set(day, list);
    }
    return map;
  }, [scoped]);

  const days = useMemo(
    () =>
      view === 'month'
        ? monthGrid(cursor, settings.weekStartsOn)
        : Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursor, settings.weekStartsOn), index)),
    [view, cursor, settings.weekStartsOn],
  );

  const weekdayOrder = useMemo(() => {
    const start = WEEKDAY_VALUES.indexOf(settings.weekStartsOn);
    return Array.from({ length: 7 }, (_, index) => WEEKDAY_VALUES[(start + index) % 7]);
  }, [settings.weekStartsOn]);

  const monthOfCursor = cursor.slice(0, 7);
  const visibleChannels = channels.filter((channel) => scopedIds.includes(channel.id));

  async function drop(day: IsoDate) {
    const project = scoped.find((item) => item.id === dragged);
    setDragged(null);
    setHoverDay(null);
    if (!project) return;
    const current = (project.publishing.scheduledFor ?? project.publishing.publishedAt ?? '').slice(0, 10);
    if (current === day) return;
    try {
      await rescheduleProject(project.id, day);
      notify({
        tone: 'success',
        title: 'Date changed',
        description: `${project.title} moved to ${formatFullDate(day)}. Local change only.`,
      });
    } catch (cause) {
      notify({
        tone: 'error',
        title: 'Could not move that video',
        description: cause instanceof Error ? cause.message : 'Unknown error.',
      });
    }
  }

  function step(direction: -1 | 1) {
    setCursor((current) =>
      view === 'month' ? addMonths(current, direction) : addDays(current, direction * 7),
    );
  }

  const rangeLabel =
    view === 'month'
      ? formatMonthYear(cursor)
      : `${formatFullDate(days[0])} – ${formatFullDate(days[6])}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        description="Scheduled and published videos, coloured by channel. Drag an entry to another day to change its date locally."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border-strong bg-card p-0.5">
              <Button
                variant={view === 'month' ? 'soft' : 'ghost'}
                size="sm"
                onClick={() => setView('month')}
                aria-pressed={view === 'month'}
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'soft' : 'ghost'}
                size="sm"
                onClick={() => setView('week')}
                aria-pressed={view === 'week'}
              >
                Week
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="icon" onClick={() => step(-1)} aria-label="Previous period">
                <ChevronLeft />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCursor(DEMO_TODAY)}>
                Today
              </Button>
              <Button variant="secondary" size="icon" onClick={() => step(1)} aria-label="Next period">
                <ChevronRight />
              </Button>
            </div>
          </div>
        }
      />

      <DemoDataNotice>
        Moving an entry changes its date in this workspace only. Nothing is rescheduled on YouTube.
      </DemoDataNotice>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{rangeLabel}</h2>
        <ChartLegend
          items={visibleChannels.map((channel) => ({
            label: channel.name,
            color: channel.branding.accentColor,
          }))}
        />
      </div>

      <div className="card-surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-subtle/60">
          {weekdayOrder.map((day) => (
            <div key={day} className="px-2 py-1.5 text-center text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              {WEEKDAY_LABELS[day]}
            </div>
          ))}
        </div>

        <div className={cn('grid grid-cols-7', view === 'month' ? 'grid-rows-6' : 'grid-rows-1')}>
          {days.map((day) => {
            const entries = byDay.get(day) ?? [];
            const outsideMonth = view === 'month' && day.slice(0, 7) !== monthOfCursor;
            const isToday = day === DEMO_TODAY;
            return (
              <div
                key={day}
                onDragOver={(event) => {
                  event.preventDefault();
                  setHoverDay(day);
                }}
                onDragLeave={() => setHoverDay((current) => (current === day ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  void drop(day);
                }}
                className={cn(
                  'min-h-28 border-b border-r border-border p-1.5 transition-colors last:border-r-0',
                  view === 'week' && 'min-h-72',
                  outsideMonth && 'bg-subtle/40',
                  hoverDay === day && 'bg-primary-soft',
                )}
              >
                <div className="mb-1 flex items-center justify-between px-0.5">
                  <span
                    className={cn(
                      'tabular text-2xs',
                      isToday
                        ? 'grid size-5 place-items-center rounded-full bg-primary font-semibold text-white'
                        : outsideMonth
                          ? 'text-muted-foreground/60'
                          : 'text-muted-foreground',
                    )}
                  >
                    {parseIsoDate(day).getDate()}
                  </span>
                  {view === 'week' && (
                    <span className="text-2xs text-muted-foreground">{formatWeekday(day)}</span>
                  )}
                </div>

                <ul className="space-y-1">
                  {entries.map((project) => {
                    const channel = channels.find((item) => item.id === project.channelId)!;
                    const published = Boolean(project.publishing.publishedAt);
                    return (
                      <li key={project.id}>
                        <Link
                          to={`/pipeline/${project.id}`}
                          draggable
                          onDragStart={() => setDragged(project.id)}
                          onDragEnd={() => setDragged(null)}
                          title={`${project.title} — ${channel.name}`}
                          className={cn(
                            'block cursor-grab rounded-md border-l-2 px-1.5 py-1 text-2xs leading-snug transition-colors hover:bg-subtle',
                            published ? 'bg-subtle/70' : 'bg-card',
                            dragged === project.id && 'opacity-40',
                          )}
                          style={{ borderLeftColor: channel.branding.accentColor }}
                        >
                          <span className="flex items-center gap-1">
                            <ChannelDot color={channel.branding.accentColor} />
                            <span className="min-w-0 flex-1 truncate font-medium">{project.title}</span>
                          </span>
                          {view === 'week' && (
                            <span className="mt-1 flex items-center gap-1">
                              <StageBadge stage={project.stage} />
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {byDay.size === 0 && (
        <div className="card-surface">
          <EmptyState
            icon={CalendarDays}
            title="Nothing on the calendar"
            description="Projects appear here once they are scheduled or published."
          />
        </div>
      )}

      <section className="card-surface">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">This month at a glance</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Slots held per channel in {formatMonthYear(cursor)}.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {visibleChannels.map((channel) => {
            const count = scoped.filter((project) => {
              if (project.channelId !== channel.id) return false;
              const slot = project.publishing.scheduledFor ?? project.publishing.publishedAt;
              return Boolean(slot) && slot!.slice(0, 7) === monthOfCursor;
            }).length;
            const expected = Math.round(
              (channel.config.cadence.videosPerWeek *
                (new Date(endOfMonth(cursor)).getDate() - new Date(startOfMonth(cursor)).getDate() + 1)) /
                7,
            );
            return (
              <li key={channel.id} className="flex items-center gap-3 px-4 py-2">
                <ChannelDot color={channel.branding.accentColor} />
                <Link to={`/channels/${channel.slug}`} className="min-w-0 flex-1 truncate text-sm hover:text-primary">
                  {channel.name}
                </Link>
                <span className="tabular text-xs text-muted-foreground">
                  {count} of about {expected} planned
                </span>
                <Badge tone={count >= expected ? 'success' : count >= expected * 0.6 ? 'warning' : 'danger'}>
                  {expected === 0 ? '—' : `${Math.round((count / expected) * 100)}%`}
                </Badge>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
