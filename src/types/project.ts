import type { IsoDate, IsoDateTime, LanguageCode, StatusTone } from './common';
import type { SourceType, VideoFormat } from './channel';

/**
 * The nine production stages. `blocked` and `failed` are deliberately NOT
 * stages — a project keeps its stage and carries a separate `blocker` /
 * `failure`, so "where is this in the pipeline" and "is it stuck" stay
 * independent questions.
 */
export type PipelineStage =
  | 'idea'
  | 'research'
  | 'script'
  | 'audio'
  | 'visuals'
  | 'editing'
  | 'review'
  | 'scheduled'
  | 'published';

export const PIPELINE_STAGES = [
  'idea',
  'research',
  'script',
  'audio',
  'visuals',
  'editing',
  'review',
  'scheduled',
  'published',
] as const;

export const STAGE_LABELS: Record<PipelineStage, string> = {
  idea: 'Idea',
  research: 'Research',
  script: 'Script',
  audio: 'Audio',
  visuals: 'Visuals',
  editing: 'Editing',
  review: 'Review',
  scheduled: 'Scheduled',
  published: 'Published',
};

export const STAGE_DESCRIPTIONS: Record<PipelineStage, string> = {
  idea: 'Captured and waiting for a decision to produce.',
  research: 'Sources being gathered and claims verified.',
  script: 'Script being drafted and edited per language.',
  audio: 'Voice tracks planned or recorded per language.',
  visuals: 'B-roll, stills and on-screen graphics assembled.',
  editing: 'Cut assembled, captions and mix in progress.',
  review: 'Awaiting an editorial sign-off before scheduling.',
  scheduled: 'Approved and holding a publish slot.',
  published: 'Released on the channel.',
};

export const STAGE_TONES: Record<PipelineStage, StatusTone> = {
  idea: 'neutral',
  research: 'info',
  script: 'info',
  audio: 'accent',
  visuals: 'accent',
  editing: 'warning',
  review: 'warning',
  scheduled: 'info',
  published: 'success',
};

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITY_VALUES = ['low', 'normal', 'high', 'urgent'] as const;

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_TONES: Record<Priority, StatusTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

/** Ordering weight so "high" sorts above "normal" in tables. */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 3,
  high: 2,
  normal: 1,
  low: 0,
};

/* ---------------------------------------------------------------- research */

export interface ResearchRecord {
  id: string;
  title: string;
  sourceUrl: string;
  sourceName: string;
  sourceType: SourceType;
  /** Date an editor checked the source was live and said what we claim. */
  verifiedOn: IsoDate | null;
  verifiedBy: string | null;
  /** Specific claims in the script this source backs up. */
  claimsSupported: string[];
  credibility: 'high' | 'medium' | 'low';
  notes?: string;
  addedOn: IsoDate;
}

/* ------------------------------------------------------- per-language track */

export type TrackStepStatus = 'not_started' | 'in_progress' | 'needs_changes' | 'ready';

export const TRACK_STEP_STATUS_LABELS: Record<TrackStepStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  needs_changes: 'Needs changes',
  ready: 'Ready',
};

export const TRACK_STEP_STATUS_TONES: Record<TrackStepStatus, StatusTone> = {
  not_started: 'neutral',
  in_progress: 'info',
  needs_changes: 'warning',
  ready: 'success',
};

/**
 * Hindi and English are tracked independently on the same project: a video can
 * be script-ready in English while Hindi is still being drafted.
 */
export interface LanguageTrack {
  language: LanguageCode;
  script: TrackStepStatus;
  /** Voice-over planning state. No audio is generated in this phase. */
  audio: TrackStepStatus;
  captions: TrackStepStatus;
  scriptWordCount: number;
  /** Draft script body, editable in the Script tab. */
  scriptBody: string;
  publishTitle: string;
  publishDescription: string;
  updatedAt: IsoDateTime;
}

/* ------------------------------------------------------------------ review */

export interface ReviewCheckItem {
  id: string;
  label: string;
  checked: boolean;
  /** A required item blocks scheduling while unchecked. */
  required: boolean;
}

export type ReviewDecision = 'pending' | 'approved' | 'changes_requested';

export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  pending: 'Awaiting review',
  approved: 'Approved',
  changes_requested: 'Changes requested',
};

export const REVIEW_DECISION_TONES: Record<ReviewDecision, StatusTone> = {
  pending: 'warning',
  approved: 'success',
  changes_requested: 'danger',
};

export interface ReviewState {
  decision: ReviewDecision;
  reviewer: string | null;
  reviewedAt: IsoDateTime | null;
  checklist: ReviewCheckItem[];
  notes: string;
}

/* -------------------------------------------------------------- publishing */

export type Visibility = 'public' | 'unlisted' | 'private';

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
};

export interface PublishingPlan {
  visibility: Visibility;
  playlist: string;
  tags: string[];
  /** Local scheduled slot; `null` until the project reaches Scheduled. */
  scheduledFor: IsoDateTime | null;
  publishedAt: IsoDateTime | null;
  /** Populated only once a real YouTube integration exists. */
  youtubeVideoId: null;
  thumbnailAssetId: string | null;
  madeForKids: boolean;
}

/* ------------------------------------------------------------- impediments */

export type BlockerReason =
  | 'awaiting_source_approval'
  | 'script_rewrite'
  | 'missing_assets'
  | 'budget_hold'
  | 'legal_review'
  | 'waiting_on_reviewer';

export const BLOCKER_REASON_LABELS: Record<BlockerReason, string> = {
  awaiting_source_approval: 'Awaiting source approval',
  script_rewrite: 'Script rewrite needed',
  missing_assets: 'Missing assets',
  budget_hold: 'Budget hold',
  legal_review: 'Legal / policy review',
  waiting_on_reviewer: 'Waiting on reviewer',
};

export interface Blocker {
  reason: BlockerReason;
  note: string;
  since: IsoDate;
}

export type FailedStep = 'research' | 'script' | 'audio' | 'visuals' | 'editing' | 'publish';

/** A simulated job failure, recorded so the board can surface it. */
export interface JobFailure {
  step: FailedStep;
  message: string;
  failedAt: IsoDateTime;
  attempts: number;
}

/* ------------------------------------------------------------------ brief */

export interface ProjectBrief {
  hook: string;
  summary: string;
  audience: string;
  angle: string;
  keywords: string[];
  callToAction: string;
}

/* ---------------------------------------------------------------- project */

export interface ActivityEntry {
  id: string;
  at: IsoDateTime;
  actor: string;
  message: string;
}

export interface VideoProject {
  id: string;
  channelId: string;
  title: string;
  format: VideoFormat;
  stage: PipelineStage;
  priority: Priority;
  languages: LanguageCode[];
  tracks: LanguageTrack[];
  targetDurationMinutes: number;
  dueDate: IsoDate;
  estimatedCost: number;
  actualCost: number | null;
  brief: ProjectBrief;
  research: ResearchRecord[];
  review: ReviewState;
  publishing: PublishingPlan;
  assetIds: string[];
  blocker: Blocker | null;
  failure: JobFailure | null;
  activity: ActivityEntry[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Fields the "New video" form collects; everything else is defaulted. */
export interface NewProjectInput {
  channelId: string;
  title: string;
  format: VideoFormat;
  languages: LanguageCode[];
  targetDurationMinutes: number;
  priority: Priority;
  dueDate: IsoDate;
  estimatedCost: number;
  stage: PipelineStage;
  hook: string;
  summary: string;
}
