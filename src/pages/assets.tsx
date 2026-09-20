import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FileAudio, FileText, Film, Image as ImageIcon, LayoutGrid, Rows3, Search, X } from 'lucide-react';
import { useScopedChannelIds, useSnapshot } from '@/store/app-store';
import {
  ASSET_TYPE_LABELS,
  ASSET_TYPE_VALUES,
  LANGUAGE_LABELS,
  LANGUAGE_SHORT,
  LICENCE_LABELS,
  LICENCE_TONES,
  type Asset,
  type AssetType,
  type LanguageCode,
  type LicenceType,
} from '@/types';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  NativeSelect,
  SortableTh,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
} from '@/components/ui';
import { ChannelAvatar, DemoDataNotice, PageHeader } from '@/components/common';
import { formatFileSize, formatSeconds } from '@/lib/format';
import { formatFullDate } from '@/lib/date';
import { cn, matchesQuery } from '@/lib/utils';
import { useSortableTable } from '@/hooks/use-sortable-table';

const TYPE_ICON: Record<AssetType, typeof ImageIcon> = {
  thumbnail: ImageIcon,
  image: ImageIcon,
  video: Film,
  audio: FileAudio,
  script: FileText,
};

/**
 * Placeholder preview. Every asset in this phase is a record without a file,
 * so the tile draws the channel's accent colour and the asset type rather than
 * pretending to show artwork.
 */
function AssetPreview({ asset, accent, className }: { asset: Asset; accent: string; className?: string }) {
  const Icon = TYPE_ICON[asset.type];
  return (
    <div
      className={cn('relative grid place-items-center overflow-hidden rounded-lg border border-border', className)}
      style={{ backgroundColor: `${accent}14` }}
      aria-hidden
    >
      <Icon className="size-6" style={{ color: accent }} />
      <span className="absolute bottom-1 right-1 rounded bg-card/90 px-1 text-[9px] font-medium uppercase text-muted-foreground">
        {asset.fileFormat}
      </span>
      <span className="absolute left-1 top-1 rounded bg-card/90 px-1 text-[9px] font-medium text-muted-foreground">
        Placeholder
      </span>
    </div>
  );
}

export function AssetsPage() {
  const { assets, channels, projects } = useSnapshot();
  const scopedIds = useScopedChannelIds();
  const [searchParams, setSearchParams] = useSearchParams();

  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [type, setType] = useState<AssetType | 'all'>('all');
  const [language, setLanguage] = useState<LanguageCode | 'all' | 'none'>('all');
  const [licence, setLicence] = useState<LicenceType | 'all'>('all');

  // Keep the URL in step so a search result link can be shared or reloaded.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (query) next.set('q', query);
    else next.delete('q');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(
    () =>
      assets.filter((asset) => {
        if (!scopedIds.includes(asset.channelId)) return false;
        if (type !== 'all' && asset.type !== type) return false;
        if (licence !== 'all' && asset.licence.type !== licence) return false;
        if (language === 'none' && asset.language !== null) return false;
        if (language !== 'all' && language !== 'none' && asset.language !== language) return false;
        return matchesQuery(query, asset.name, asset.tags.join(' '), asset.licence.source);
      }),
    [assets, scopedIds, type, licence, language, query],
  );

  const rows = useMemo(
    () =>
      filtered.map((asset) => ({
        asset,
        id: asset.id,
        name: asset.name,
        typeLabel: ASSET_TYPE_LABELS[asset.type],
        channel: channels.find((item) => item.id === asset.channelId)?.name ?? '',
        sizeKb: asset.sizeKb,
        createdOn: asset.createdOn,
      })),
    [filtered, channels],
  );
  const { sorted, sortKey, direction, toggle } = useSortableTable(rows, 'createdOn', 'desc');

  const filtersActive = query !== '' || type !== 'all' || language !== 'all' || licence !== 'all';
  function clearFilters() {
    setQuery('');
    setType('all');
    setLanguage('all');
    setLicence('all');
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asset Library"
        description="Thumbnails, stills, footage, voice tracks and scripts, with the licence each one carries."
        actions={
          <div className="flex items-center rounded-lg border border-border-strong bg-card p-0.5">
            <Button variant={view === 'grid' ? 'soft' : 'ghost'} size="sm" onClick={() => setView('grid')} aria-pressed={view === 'grid'}>
              <LayoutGrid /> Grid
            </Button>
            <Button variant={view === 'table' ? 'soft' : 'ghost'} size="sm" onClick={() => setView('table')} aria-pressed={view === 'table'}>
              <Rows3 /> Table
            </Button>
          </div>
        }
      />

      <DemoDataNotice>
        Every asset here is a labelled placeholder record. No files are stored, nothing is fetched from a
        paid service, and the previews are drawn locally.
      </DemoDataNotice>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets and tags…"
            aria-label="Search assets"
            className="pl-8"
          />
        </div>
        <NativeSelect value={type} onChange={(event) => setType(event.target.value as AssetType | 'all')} aria-label="Filter by asset type" className="w-auto">
          <option value="all">All types</option>
          {ASSET_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>
              {ASSET_TYPE_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode | 'all' | 'none')}
          aria-label="Filter by language"
          className="w-auto"
        >
          <option value="all">Any language</option>
          <option value="en">{LANGUAGE_LABELS.en}</option>
          <option value="hi">{LANGUAGE_LABELS.hi}</option>
          <option value="none">Language-neutral</option>
        </NativeSelect>
        <NativeSelect
          value={licence}
          onChange={(event) => setLicence(event.target.value as LicenceType | 'all')}
          aria-label="Filter by licence"
          className="w-auto"
        >
          <option value="all">All licences</option>
          {(Object.keys(LICENCE_LABELS) as LicenceType[]).map((value) => (
            <option key={value} value={value}>
              {LICENCE_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X /> Clear
          </Button>
        )}
        <span className="text-2xs text-muted-foreground">
          {filtered.length} of {assets.filter((asset) => scopedIds.includes(asset.channelId)).length} assets
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            title="No assets match those filters"
            description="Try a different type, language or licence."
            action={{ label: 'Clear filters', onClick: clearFilters }}
          />
        </div>
      ) : view === 'grid' ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, 60).map((asset) => {
            const channel = channels.find((item) => item.id === asset.channelId)!;
            const project = projects.find((item) => item.id === asset.projectId);
            return (
              <li key={asset.id} className="card-surface flex flex-col p-3">
                <AssetPreview asset={asset} accent={channel.branding.accentColor} className="h-28 w-full" />
                <p className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug">{asset.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <ChannelAvatar channel={channel} size="sm" />
                  <span className="truncate">{channel.name}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge>
                  {asset.language && <Badge tone="neutral">{LANGUAGE_SHORT[asset.language]}</Badge>}
                  <Badge tone={LICENCE_TONES[asset.licence.type]}>{LICENCE_LABELS[asset.licence.type]}</Badge>
                </div>
                <dl className="mt-2 space-y-0.5 text-2xs text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>Size</dt>
                    <dd className="tabular">{formatFileSize(asset.sizeKb)}</dd>
                  </div>
                  {asset.dimensions && (
                    <div className="flex justify-between gap-2">
                      <dt>Dimensions</dt>
                      <dd className="tabular">
                        {asset.dimensions.width}×{asset.dimensions.height}
                      </dd>
                    </div>
                  )}
                  {asset.durationSeconds !== null && (
                    <div className="flex justify-between gap-2">
                      <dt>Duration</dt>
                      <dd className="tabular">{formatSeconds(asset.durationSeconds)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt>Source</dt>
                    <dd className="truncate text-right">{asset.licence.source}</dd>
                  </div>
                </dl>
                {project && (
                  <Link
                    to={`/pipeline/${project.id}`}
                    className="mt-2 truncate border-t border-border pt-2 text-2xs text-primary hover:underline"
                  >
                    {project.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card-surface">
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <SortableTh active={sortKey === 'name'} direction={direction} onSort={() => toggle('name')}>
                    Asset
                  </SortableTh>
                  <SortableTh active={sortKey === 'typeLabel'} direction={direction} onSort={() => toggle('typeLabel')}>
                    Type
                  </SortableTh>
                  <SortableTh active={sortKey === 'channel'} direction={direction} onSort={() => toggle('channel')}>
                    Channel
                  </SortableTh>
                  <Th>Language</Th>
                  <Th>Licence / source</Th>
                  <SortableTh active={sortKey === 'sizeKb'} direction={direction} onSort={() => toggle('sizeKb')} className="text-right">
                    Size
                  </SortableTh>
                  <SortableTh active={sortKey === 'createdOn'} direction={direction} onSort={() => toggle('createdOn')}>
                    Created
                  </SortableTh>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 200).map((row) => {
                  const asset = row.asset;
                  const channel = channels.find((item) => item.id === asset.channelId)!;
                  return (
                    <Tr key={asset.id}>
                      <Td className="max-w-72">
                        <span className="block truncate font-medium">{asset.name}</span>
                        <span className="block truncate text-2xs text-muted-foreground">
                          {asset.tags.join(' · ')}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">{ASSET_TYPE_LABELS[asset.type]}</Td>
                      <Td>
                        <Link to={`/channels/${channel.slug}`} className="flex items-center gap-2 hover:text-primary">
                          <ChannelAvatar channel={channel} size="sm" />
                          <span className="truncate">{channel.name}</span>
                        </Link>
                      </Td>
                      <Td>{asset.language ? LANGUAGE_LABELS[asset.language] : '—'}</Td>
                      <Td>
                        <Badge tone={LICENCE_TONES[asset.licence.type]}>{LICENCE_LABELS[asset.licence.type]}</Badge>
                        <span className="mt-1 block truncate text-2xs text-muted-foreground">
                          {asset.licence.attribution ?? asset.licence.source}
                        </span>
                      </Td>
                      <Td className="tabular text-right">{formatFileSize(asset.sizeKb)}</Td>
                      <Td className="text-muted-foreground">{formatFullDate(asset.createdOn)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}
    </div>
  );
}
