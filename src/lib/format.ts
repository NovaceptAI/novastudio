import type { CurrencyCode } from '@/types';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number, currency: CurrencyCode = 'INR'): string {
  return currency === 'USD' ? usdFormatter.format(value) : inrFormatter.format(value);
}

/**
 * Indian-numbering short form: 12,40,000 reads as "12.4L". Used in stat tiles
 * and chart axes where the full number would crowd the layout.
 */
export function formatCompactInr(value: number): string {
  if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

/** Watch time in hours, shown as hours for small numbers and "k hrs" above 1,000. */
export function formatHours(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k hrs`;
  return `${value.toFixed(value < 10 ? 1 : 0)} hrs`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const whole = Math.floor(minutes);
  const seconds = Math.round((minutes - whole) * 60);
  return seconds ? `${whole}m ${seconds}s` : `${whole} min`;
}

export function formatFileSize(sizeKb: number): string {
  if (sizeKb >= 1024 * 1024) return `${(sizeKb / (1024 * 1024)).toFixed(1)} GB`;
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${Math.round(sizeKb)} KB`;
}

export function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${mins}:${rest.toString().padStart(2, '0')}`;
}
