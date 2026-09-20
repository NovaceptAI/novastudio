import type { CurrencyCode, LanguageCode, Weekday } from './common';

export interface WorkspaceSettings {
  workspaceName: string;
  defaultLanguage: LanguageCode;
  timezone: string;
  currency: CurrencyCode;
  weekStartsOn: Weekday;
  /** Blocks the Review -> Scheduled transition until review is approved. */
  requireReviewBeforeScheduling: boolean;
  /** Requires every source on a project to carry a verification date. */
  requireSourceVerification: boolean;
  /** Warn when a project's estimate exceeds this. */
  perVideoBudgetCap: number;
  /** Warn when a channel's committed spend exceeds this share of its budget. */
  monthlyBudgetWarnPct: number;
  defaultDateRangeDays: number;
  notifyOnBlocked: boolean;
  notifyOnFailedJob: boolean;
}

export type IntegrationStatus = 'not_connected';

export type IntegrationCategory = 'publishing' | 'infrastructure' | 'voice' | 'visuals';

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  publishing: 'Publishing',
  infrastructure: 'Infrastructure',
  voice: 'Voice',
  visuals: 'Visuals',
};

export interface Integration {
  id: string;
  name: string;
  vendor: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  /** What this service is intended to do once it is wired up. */
  purpose: string;
  capabilities: string[];
  /** What has to exist on the backend before a connection is possible. */
  requires: string[];
  docsUrl: string;
}
