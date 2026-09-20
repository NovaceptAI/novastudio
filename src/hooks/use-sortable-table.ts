import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

/**
 * Column sorting for the data tables. Clicking the active column flips the
 * direction; clicking a new one starts descending, which is what a reader
 * usually wants from a metric column.
 */
export function useSortableTable<T extends Record<string, unknown>>(
  rows: T[],
  initialKey: keyof T & string,
  initialDirection: SortDirection = 'desc',
) {
  const [sortKey, setSortKey] = useState<keyof T & string>(initialKey);
  const [direction, setDirection] = useState<SortDirection>(initialDirection);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === 'number' && typeof right === 'number') {
        return direction === 'asc' ? left - right : right - left;
      }
      const result = String(left ?? '').localeCompare(String(right ?? ''));
      return direction === 'asc' ? result : -result;
    });
    return copy;
  }, [rows, sortKey, direction]);

  function toggle(key: keyof T & string) {
    if (key === sortKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDirection('desc');
    }
  }

  return { sorted, sortKey, direction, toggle };
}
