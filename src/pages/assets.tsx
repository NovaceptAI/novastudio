import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FileAudio, FileText, Film, Image as ImageIcon, LayoutGrid, Plus, Rows3, Search, Trash2, X } from 'lucide-react';
import { useData, useFilters, useScopedChannelIds, useSnapshot } from '@/store/app-store';
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
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  NativeSelect,
  SortableTh,
  Table,
  TableWrap,
  Td,
  Th,
  Tr,
  useToast,
} from '@/components/ui';
import { ChannelAvatar, Notice, PageHeader } from '@/components/common';
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
 * Assets are records without files until storage is connected, so the tile
 * shows the channel colour and asset type rather than pretending to preview.
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
        Record only
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
  const [addOpen, setAddOpen] = useState(false);
  const { deleteAsset } = useData();
  const { notify } = useToast();

  async function remove(asset: Asset) {
    await deleteAsset(asset.id);
    notify({ tone: 'success', title: 'Asset removed', description: asset.name });
  }

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
          <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border-strong bg-card p-0.5">
            <Button variant={view === 'grid' ? 'soft' : 'ghost'} size="sm" onClick={() => setView('grid')} aria-pressed={view === 'grid'}>
              <LayoutGrid /> Grid
            </Button>
            <Button variant={view === 'table' ? 'soft' : 'ghost'} size="sm" onClick={() => setView('table')} aria-pressed={view === 'table'}>
              <Rows3 /> Table
            </Button>
          </div>
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            <Plus /> Add asset
          </Button>
          </div>
        }
      />

      <Notice>
        This is a register: each entry records an asset's channel, type, language, licence and source.
        Files themselves are not stored until asset storage is connected.
      </Notice>

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
          {assets.length === 0 ? (
            <EmptyState
              title="No assets yet"
              description="Add thumbnails, images, footage, audio and scripts as they are made, with their licence and source."
              action={{ label: 'Add asset', onClick: () => setAddOpen(true) }}
            />
          ) : (
            <EmptyState
              title="No assets match those filters"
              description="Try a different type, language or licence."
              action={{ label: 'Clear filters', onClick: clearFilters }}
            />
          )}
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
                    <dd className="tabular">{asset.sizeKb ? formatFileSize(asset.sizeKb) : '—'}</dd>
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
                <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                  {project ? (
                    <Link
                      to={`/pipeline/${project.id}`}
                      className="min-w-0 flex-1 truncate text-2xs text-primary hover:underline"
                    >
                      {project.title}
                    </Link>
                  ) : (
                    <span className="flex-1 text-2xs text-muted-foreground">Channel asset</span>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label={`Remove ${asset.name}`} onClick={() => void remove(asset)}>
                    <Trash2 />
                  </Button>
                </div>
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
                      <Td className="tabular text-right">{asset.sizeKb ? formatFileSize(asset.sizeKb) : '—'}</Td>
                      <Td className="text-muted-foreground">{formatFullDate(asset.createdOn)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}
      <AddAssetDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddAssetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { channels, projects } = useSnapshot();
  const { addAsset } = useData();
  const { channelId: selectedChannel } = useFilters();
  const { notify } = useToast();

  const initial = () => ({
    name: '',
    type: 'thumbnail' as AssetType,
    channelId: selectedChannel === 'all' ? channels[0].id : selectedChannel,
    projectId: '',
    language: '' as LanguageCode | '',
    fileFormat: '',
    licence: 'internal' as LicenceType,
    source: '',
    sourceUrl: '',
    attribution: '',
    tags: '',
  });
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ReturnType<typeof initial>>(key: K, value: ReturnType<typeof initial>[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Give the asset a name.';
    if (form.sourceUrl && !/^https?:\/\//.test(form.sourceUrl)) next.sourceUrl = 'Must start with http:// or https://';
    if (form.licence === 'cc_by' && !form.attribution.trim()) next.attribution = 'CC BY requires an attribution line.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await addAsset({
        name: form.name.trim(),
        type: form.type,
        channelId: form.channelId,
        projectId: form.projectId || null,
        language: form.language || null,
        fileFormat: form.fileFormat.trim().replace(/^\./, '').toLowerCase() || '—',
        sizeKb: 0,
        durationSeconds: null,
        dimensions: null,
        licence: {
          type: form.licence,
          source: form.source.trim() || LICENCE_LABELS[form.licence],
          sourceUrl: form.sourceUrl.trim() || null,
          attribution: form.attribution.trim() || null,
        },
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
      notify({ tone: 'success', title: 'Asset added' });
      setForm(initial());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const channelProjects = projects.filter((project) => project.channelId === form.channelId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add asset</DialogTitle>
          <DialogDescription>Records the asset and its rights. No file is uploaded.</DialogDescription>
        </DialogHeader>
        {/* Validated in submit(); native validation would block silently. */}
        <form onSubmit={submit} className="contents" noValidate>
          <DialogBody className="space-y-4">
            <Field label="Name" required error={errors.name}>
              {(props) => <Input {...props} value={form.name} onChange={(event) => set('name', event.target.value)} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Type">
                {(props) => (
                  <NativeSelect {...props} value={form.type} onChange={(event) => set('type', event.target.value as AssetType)}>
                    {ASSET_TYPE_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {ASSET_TYPE_LABELS[value]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <Field label="Language">
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={form.language}
                    onChange={(event) => set('language', event.target.value as LanguageCode | '')}
                  >
                    <option value="">Language-neutral</option>
                    <option value="en">{LANGUAGE_LABELS.en}</option>
                    <option value="hi">{LANGUAGE_LABELS.hi}</option>
                  </NativeSelect>
                )}
              </Field>
              <Field label="File format" hint="e.g. png, wav, mp4">
                {(props) => <Input {...props} value={form.fileFormat} onChange={(event) => set('fileFormat', event.target.value)} />}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Channel">
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={form.channelId}
                    onChange={(event) => {
                      set('channelId', event.target.value);
                      set('projectId', '');
                    }}
                  >
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <Field label="Video" hint={channelProjects.length ? undefined : 'No videos on this channel yet.'}>
                {(props) => (
                  <NativeSelect {...props} value={form.projectId} onChange={(event) => set('projectId', event.target.value)}>
                    <option value="">Not tied to a video</option>
                    {channelProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Licence">
                {(props) => (
                  <NativeSelect {...props} value={form.licence} onChange={(event) => set('licence', event.target.value as LicenceType)}>
                    {(Object.keys(LICENCE_LABELS) as LicenceType[]).map((value) => (
                      <option key={value} value={value}>
                        {LICENCE_LABELS[value]}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <Field label="Source" hint="Who made it, or where it came from.">
                {(props) => <Input {...props} value={form.source} onChange={(event) => set('source', event.target.value)} />}
              </Field>
              <Field label="Source URL" error={errors.sourceUrl}>
                {(props) => <Input {...props} type="url" value={form.sourceUrl} onChange={(event) => set('sourceUrl', event.target.value)} />}
              </Field>
              <Field label="Attribution" error={errors.attribution}>
                {(props) => <Input {...props} value={form.attribution} onChange={(event) => set('attribution', event.target.value)} />}
              </Field>
            </div>
            <Field label="Tags" hint="Comma separated.">
              {(props) => <Input {...props} value={form.tags} onChange={(event) => set('tags', event.target.value)} />}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
