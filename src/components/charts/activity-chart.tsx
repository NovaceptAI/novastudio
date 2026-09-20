import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeseriesPoint } from '@/types';
import { AXIS_COLOR, ChartTooltip, GRID_COLOR, PRIMARY_SERIES, axisProps } from './chart-kit';
import { formatCompactNumber, formatNumber } from '@/lib/format';
import { formatDayMonth, formatFullDate } from '@/lib/date';

/** Tick density that keeps labels from colliding at any range length. */
function tickInterval(count: number): number {
  if (count <= 14) return 0;
  if (count <= 31) return 3;
  if (count <= 62) return 6;
  return 13;
}

/**
 * Videos published per day. A count of discrete events, so bars — with the
 * 4px rounded top the mark spec calls for and a surface gap between them.
 */
export function PublishingActivityChart({ data }: { data: TimeseriesPoint[] }) {
  const interval = useMemo(() => tickInterval(data.length), [data.length]);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          interval={interval}
          tickFormatter={formatDayMonth}
          {...axisProps}
        />
        <YAxis allowDecimals={false} width={38} {...axisProps} />
        <Tooltip
          cursor={{ fill: 'hsl(43 20% 93.1% / 0.75)' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={formatFullDate(String(payload[0].payload.date))}
                rows={[
                  {
                    label: 'Videos published',
                    value: formatNumber(Number(payload[0].value)),
                    color: PRIMARY_SERIES,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="published" fill={PRIMARY_SERIES} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Views over time. One continuous measure, so a single filled area. */
export function ViewsAreaChart({ data, height = 220 }: { data: TimeseriesPoint[]; height?: number }) {
  const interval = useMemo(() => tickInterval(data.length), [data.length]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -6 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" interval={interval} tickFormatter={formatDayMonth} {...axisProps} />
        <YAxis width={48} tickFormatter={formatCompactNumber} {...axisProps} />
        <Tooltip
          cursor={{ stroke: AXIS_COLOR, strokeWidth: 1, strokeDasharray: '3 3' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={formatFullDate(String(payload[0].payload.date))}
                rows={[
                  { label: 'Views', value: formatNumber(Number(payload[0].value)), color: PRIMARY_SERIES },
                  {
                    label: 'Watch time',
                    value: `${formatCompactNumber(Number(payload[0].payload.watchTimeHours))} hrs`,
                  },
                ]}
              />
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke={PRIMARY_SERIES}
          strokeWidth={2}
          fill={PRIMARY_SERIES}
          fillOpacity={0.1}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface ChannelSeries {
  channelId: string;
  name: string;
  color: string;
}

/**
 * Views per channel over time. Colour follows the channel, not its rank, so
 * filtering the list never repaints the series that remain.
 */
export function ChannelViewsChart({
  data,
  series,
  height = 260,
}: {
  /** One row per day carrying a `date` plus one numeric column per channel. */
  data: Record<string, number | string>[];
  series: ChannelSeries[];
  height?: number;
}) {
  const interval = useMemo(() => tickInterval(data.length), [data.length]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -6 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" interval={interval} tickFormatter={formatDayMonth} {...axisProps} />
        <YAxis width={48} tickFormatter={formatCompactNumber} {...axisProps} />
        <Tooltip
          cursor={{ stroke: AXIS_COLOR, strokeWidth: 1, strokeDasharray: '3 3' }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={formatFullDate(String(label))}
                rows={payload
                  .slice()
                  .sort((a, b) => Number(b.value) - Number(a.value))
                  .slice(0, 6)
                  .map((entry) => ({
                    label: series.find((item) => item.channelId === entry.dataKey)?.name ?? String(entry.dataKey),
                    value: formatNumber(Number(entry.value)),
                    color: String(entry.color),
                  }))}
              />
            ) : null
          }
        />
        {series.map((item) => (
          <Line
            key={item.channelId}
            type="monotone"
            dataKey={item.channelId}
            stroke={item.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Shorts against long-form. Two stacked parts of one total. */
export function FormatSplitChart({
  data,
  height = 220,
}: {
  data: { date: string; shortsViews: number; longFormViews: number }[];
  height?: number;
}) {
  const interval = useMemo(() => tickInterval(data.length), [data.length]);
  const longFormColor = PRIMARY_SERIES;
  const shortsColor = 'hsl(187 92% 33%)';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -6 }} barCategoryGap="24%">
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="date" interval={interval} tickFormatter={formatDayMonth} {...axisProps} />
        <YAxis width={48} tickFormatter={formatCompactNumber} {...axisProps} />
        <Tooltip
          cursor={{ fill: 'hsl(43 20% 93.1% / 0.75)' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={formatFullDate(String(payload[0].payload.date))}
                rows={[
                  {
                    label: 'Long-form',
                    value: formatNumber(Number(payload[0].payload.longFormViews)),
                    color: longFormColor,
                  },
                  {
                    label: 'Shorts',
                    value: formatNumber(Number(payload[0].payload.shortsViews)),
                    color: shortsColor,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="longFormViews" stackId="views" fill={longFormColor} maxBarSize={26} />
        <Bar dataKey="shortsViews" stackId="views" fill={shortsColor} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
