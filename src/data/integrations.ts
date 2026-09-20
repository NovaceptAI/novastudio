import type { Integration, WorkspaceSettings } from '@/types';

/**
 * Nothing here is authenticated. Every card describes what the service would do
 * once a backend exists to hold its credentials; the frontend never collects,
 * stores or transmits a secret.
 */
export const INTEGRATIONS: Integration[] = [
  {
    id: 'int_youtube',
    name: 'YouTube Data API',
    vendor: 'Google',
    category: 'publishing',
    status: 'not_connected',
    purpose:
      'Publish approved videos to the linked channel, then read back views, watch time and impressions for the Analytics screens.',
    capabilities: [
      'Upload a rendered video with its title, description and tags',
      'Set the publish slot, visibility and "Made for Kids" flag',
      'Pull channel and per-video reporting into the analytics store',
      'Confirm which NovaStudio channel maps to which real YouTube channel',
    ],
    requires: [
      'A Google Cloud project with the YouTube Data and Analytics APIs enabled',
      'An OAuth consent screen and one refresh token per channel, held server-side',
      'A backend token store — refresh tokens must never reach the browser',
      'Quota planning: uploads are expensive against the daily quota',
    ],
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
  {
    id: 'int_aws',
    name: 'AWS (S3 · MediaConvert)',
    vendor: 'Amazon Web Services',
    category: 'infrastructure',
    status: 'not_connected',
    purpose:
      'Hold every master asset and render the final cuts. The Asset Library would read from this rather than from seeded placeholders.',
    capabilities: [
      'Object storage for scripts, stills, voice tracks and masters',
      'Transcoding and caption burn-in per language track',
      'Signed URLs so previews work without making a bucket public',
      'Lifecycle rules to move finished projects to cold storage',
    ],
    requires: [
      'An S3 bucket per environment with versioning on',
      'An IAM role scoped to that bucket, assumed by the backend only',
      'A MediaConvert queue and job template per output format',
      'A cost alarm — transcoding is the largest line in the production estimate',
    ],
    docsUrl: 'https://docs.aws.amazon.com/mediaconvert/',
  },
  {
    id: 'int_elevenlabs',
    name: 'ElevenLabs',
    vendor: 'ElevenLabs',
    category: 'voice',
    status: 'not_connected',
    purpose:
      'Turn approved scripts into voice tracks for the narrator and character slots configured on each channel.',
    capabilities: [
      'Map each channel voice slot to a provider voice id',
      'Render Hindi and English tracks separately from the same project',
      'Regenerate a single line without re-rendering the episode',
      'Report per-character cost back into the production estimate',
    ],
    requires: [
      'An account with the character allowance the cadence implies',
      'A server-side key; the browser must never hold it',
      'Voice selection and, for character voices, documented consent for any cloned voice',
      'A rendered-audio cache so retries do not re-bill the same line',
    ],
    docsUrl: 'https://elevenlabs.io/docs',
  },
  {
    id: 'int_images',
    name: 'Image generation provider',
    vendor: 'Unassigned',
    category: 'visuals',
    status: 'not_connected',
    purpose:
      'Produce thumbnails, background plates and illustration frames against each channel’s branding notes.',
    capabilities: [
      'Generate thumbnail candidates from the project title and hook',
      'Produce consistent character and background plates for the kids channel',
      'Write licence provenance into the asset record on import',
      'Keep a per-channel style reference so output stays on brand',
    ],
    requires: [
      'A chosen provider with commercial-use terms that permit this',
      'A server-side key and a per-channel spend cap',
      'A human approval step before any generated frame reaches a published video',
      'Provenance recorded on every asset for the licence column in the library',
    ],
    docsUrl: 'https://platform.openai.com/docs/guides/images',
  },
  {
    id: 'int_video',
    name: 'Video generation provider',
    vendor: 'Unassigned',
    category: 'visuals',
    status: 'not_connected',
    purpose:
      'Generate short motion segments and animated inserts where stills will not carry the sequence.',
    capabilities: [
      'Short b-roll segments from a shot description',
      'Animated inserts for the diagram-led channels',
      'Per-shot regeneration without re-rendering the timeline',
      'Cost estimation per second of generated footage',
    ],
    requires: [
      'A provider selected against the quality bar for animation work',
      'A server-side key and a hard per-project cap',
      'Review before use: generated motion needs a human pass',
      'Storage wired to the same bucket as the rest of the assets',
    ],
    docsUrl: 'https://platform.openai.com/docs/guides/video-generation',
  },
];

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  workspaceName: 'NovaStudio',
  defaultLanguage: 'en',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  weekStartsOn: 'mon',
  requireReviewBeforeScheduling: true,
  requireSourceVerification: true,
  perVideoBudgetCap: 60000,
  monthlyBudgetWarnPct: 85,
  defaultDateRangeDays: 30,
  notifyOnBlocked: true,
  notifyOnFailedJob: true,
};
