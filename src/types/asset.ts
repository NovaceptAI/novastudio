import type { IsoDate, LanguageCode, StatusTone } from './common';

export type AssetType = 'thumbnail' | 'image' | 'video' | 'audio' | 'script';

export const ASSET_TYPE_VALUES = ['thumbnail', 'image', 'video', 'audio', 'script'] as const;

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  thumbnail: 'Thumbnail',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  script: 'Script',
};

/**
 * Licence provenance. Every sample asset carries one so the library models the
 * rights metadata a real pipeline has to keep.
 */
export type LicenceType =
  | 'internal'
  | 'cc0'
  | 'cc_by'
  | 'stock_licensed'
  | 'royalty_free'
  | 'rights_pending';

export const LICENCE_LABELS: Record<LicenceType, string> = {
  internal: 'Internal original',
  cc0: 'CC0 / public domain',
  cc_by: 'CC BY (attribution)',
  stock_licensed: 'Stock licence',
  royalty_free: 'Royalty-free',
  rights_pending: 'Rights pending',
};

export const LICENCE_TONES: Record<LicenceType, StatusTone> = {
  internal: 'success',
  cc0: 'success',
  cc_by: 'info',
  stock_licensed: 'info',
  royalty_free: 'neutral',
  rights_pending: 'warning',
};

export interface AssetLicence {
  type: LicenceType;
  source: string;
  sourceUrl: string | null;
  attribution: string | null;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  channelId: string;
  projectId: string | null;
  language: LanguageCode | null;
  /** File extension shown in the metadata row, e.g. `png`, `wav`. */
  fileFormat: string;
  sizeKb: number;
  durationSeconds: number | null;
  dimensions: { width: number; height: number } | null;
  licence: AssetLicence;
  tags: string[];
  createdOn: IsoDate;
  /**
   * Every asset in this phase is a locally rendered stand-in — no file is
   * fetched from a paid service. The library renders a generated preview.
   */
  placeholder: true;
}
