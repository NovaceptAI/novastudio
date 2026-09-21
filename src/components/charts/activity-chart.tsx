import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimeseriesPoint } from '@/types';
import { ChartTooltip, GRID_COLOR, PRIMARY_SERIES, axisProps } from './chart-kit';
import { formatNumber } from '@/lib/format';
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
