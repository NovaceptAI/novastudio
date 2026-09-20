/**
 * Shared primitives used across the NovaStudio domain model.
 *
 * `erasableSyntaxOnly` is on, so unions + `as const` maps are used instead of
 * TypeScript enums. The `*_VALUES` arrays are the single source of truth for
 * iteration order in selects, filters and Kanban columns.
 */

export type LanguageCode = 'en' | 'hi';

export const LANGUAGE_VALUES = ['en', 'hi'] as const;

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi',
};

export const LANGUAGE_SHORT: Record<LanguageCode, string> = {
  en: 'EN',
  hi: 'HI',
};

export type CurrencyCode = 'INR' | 'USD';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const WEEKDAY_VALUES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/** Tone used by badges and inline status dots. */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

/** An ISO-8601 date string, `YYYY-MM-DD`. */
export type IsoDate = string;

/** A full ISO-8601 timestamp. */
export type IsoDateTime = string;

export interface DateRange {
  from: IsoDate;
  to: IsoDate;
}

/** Result envelope used by the mock service layer, mirroring a REST response. */
export interface Paginated<T> {
  items: T[];
  total: number;
}
