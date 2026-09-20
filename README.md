# NovaStudio

An admin dashboard for running a network of ten automated YouTube channels: channel
configuration, a production pipeline, a publishing calendar, an asset library and
performance reporting.

**This is phase one: a frontend with seeded demo data.** Nothing is connected to
YouTube or to any production service, and the app says so on every screen that
shows a number or offers an action that would need one.

## Setup

Requires Node 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
npm run preview  # serve the production build
npm run lint
npm run typecheck
```

## What it does

| Screen | What it covers |
| --- | --- |
| **Overview** | Channel and production counts, views and watch time, estimated spend in INR, a publishing-activity chart, a channel performance table, upcoming releases, and everything needing attention. The global channel selector and the date range both filter it. |
| **Channels** | All ten channels as a grid or a table. Each detail page holds recent videos, the content-idea backlog, the upcoming schedule, editable configuration (audience, tone, languages, formats, duration, cadence, budget, approved sources, editorial rules), branding and voice slots, and an explicit comparison between internal configuration and a connected YouTube channel. |
| **Content Pipeline** | Idea → Research → Script → Audio → Visuals → Editing → Review → Scheduled → Published, as a board or a table. Blocked work and failed jobs are tracked *alongside* the stages, not as stages. Each project opens onto Brief, Research, Script, Audio & Visuals, Review and Publishing tabs. |
| **Calendar** | Month and week views, colour-coded per channel, with drag-to-reschedule. |
| **Asset Library** | Thumbnails, images, video, audio and scripts, filterable by channel, type, language and licence. |
| **Analytics** | Views, watch time, subscribers, thumbnail CTR, average percentage viewed, production cost and revenue, with Shorts and long-form kept distinguishable. |
| **Integrations** | YouTube, AWS, ElevenLabs and image/video providers — all "Not connected", each with what it would do and what it needs first. |
| **Settings** | Default language, timezone, currency, review requirements, budget limits, and the reset-demo-data action. |

### Things worth knowing

- **Hindi and English are separate tracks on the same project.** A video can be
  script-ready in English while Hindi is still being drafted; the pipeline cards
  show each track's own state.
- **Blocked ≠ a stage.** A project keeps its stage and carries a separate blocker
  or failure, so "where is this" and "is it stuck" stay independent questions.
- **Two rules are enforced on the Scheduled transition** (both switchable in
  Settings): review sign-off, and a verification date on every research source.
- **Channels publish below their configured cadence on purpose.** Cadence is the
  plan and the seeded archive is what shipped; the Overview surfaces the gap
  instead of hiding it.

## Project structure

```
src/
├── types/          Domain model. Unions and `as const` maps, no enums.
│                   The *_VALUES arrays drive iteration order everywhere.
├── data/           Seed data and the generators that expand it.
│   ├── channels.ts        The ten channels, hand-written.
│   ├── project-seeds.ts   34 projects across every stage.
│   ├── project-builder.ts Expands a seed into a full project: language
│   │                      tracks, review state, publishing plan, activity.
│   ├── archive.ts         Published back catalogue for the last 12 weeks.
│   ├── assets.ts          Placeholder asset records.
│   └── analytics.ts       180 days of daily per-channel metrics.
├── services/       The API boundary.
│   ├── api.ts             Every screen talks to this and nothing else.
│   └── storage.ts         Guarded localStorage access.
├── store/          Two contexts: loaded data + mutations, and the global
│                   channel/date/search filters.
├── lib/            analytics (aggregation), selectors (pipeline queries),
│                   date, format, utils.
├── components/
│   ├── ui/                Primitives on Radix: button, badge, dialog, tabs,
│   │                      table, field, toast, tooltip, states.
│   ├── common/            Domain pieces: channel avatar, stat tile, badges,
│   │                      page header, demo-data notice, filter bar.
│   ├── charts/            Recharts wrappers with one shared visual language.
│   ├── layout/            App shell, sidebar, global search.
│   └── projects/          New-project dialog, board card.
├── pages/          One file per route.
└── styles/         Tailwind layer and the design tokens.
```

### Demo data

All of it is deterministic — seeded pseudo-random generators keyed off channel
ids — so charts, tables and totals agree with each other and are identical on
every load. It is anchored to a fixed date (`DEMO_TODAY` in `lib/date.ts`)
rather than the system clock.

The numbers are derived rather than invented: impressions come from views and
CTR, watch time from views and average view duration, Shorts plus long-form
always sum to total views, `videosPublished` counts projects that actually carry
a publish date, and revenue is `null` — rendered as "Not monetised" — for the
channels configured that way.

Local edits are mirrored into `localStorage` under `novastudio.demo.v1`. Metrics
are *not* persisted; they are recomputed from the stored projects on load, so
moving a publish date keeps the analytics honest. **Settings → Reset demo data**
clears everything and restores the seeded workspace.

### Colour

Each channel owns an accent colour, used for its avatar, its calendar entries
and its chart series. The ten were checked with a palette validator: they sit in
one lightness band, clear the chroma floor, and every adjacent pair clears the
colour-vision-deficiency separation threshold against the light surface. Colour
follows the channel, never its rank, so filtering never repaints the series that
remain — and no chart relies on colour alone.

## Integration boundaries

`src/services/api.ts` is the seam. Every function there already returns a
promise, takes plain arguments and returns plain domain objects, so replacing the
in-memory store with HTTP calls is a change to that one file and to nothing in
the screens.

Deliberately **not** in this phase:

| Not implemented | Why, and what it needs |
| --- | --- |
| YouTube publishing and analytics | Needs a Google Cloud project, an OAuth consent screen, and one refresh token per channel held server-side. |
| Asset storage and transcoding | Needs an S3 bucket, a scoped IAM role assumed by a backend, and MediaConvert job templates. |
| Voice generation | Needs a server-side ElevenLabs key, a character allowance, and a rendered-audio cache so retries do not re-bill. |
| Image and video generation | Needs a provider with commercial-use terms, a per-channel spend cap, and a human approval step before anything ships. |
| Authentication and multi-user | There are no accounts; "You" is the only actor. |

**No API keys or secrets are collected anywhere in this frontend**, and none
should be. Anything a browser holds can be read by anyone using that browser.
The Integrations page lists what each service will need once a backend exists to
hold its credentials.

Stage changes, scheduling and publishing are local record-keeping only. Moving a
project to Published records the decision in NovaStudio; it does not upload a
file or make anything live.

## Accessibility

Labelled controls throughout, visible focus rings, a skip link, keyboard-reachable
stage changes on every board card (the drag handle is not the only route),
`/` to focus global search with arrow-key navigation through results, landmark
regions, and `prefers-reduced-motion` respected. Empty, loading and error states
are implemented rather than left to chance.
