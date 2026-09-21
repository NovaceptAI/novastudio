# NovaStudio

A production tracker for a network of ten YouTube channels: what each channel
still needs setting up, every video and the stage it has reached, and — on the
Overview — an ordered list of what to do next.

It starts empty. The ten channels exist with only what was specified for them
(name, languages, and the two stated audiences); every video, idea, asset and
setting is added by you. Nothing is connected to YouTube or any production
service yet, so there are no audience numbers anywhere.

> **Data is saved in the browser.** Records live in this browser's localStorage:
> not shared, not on other devices, and lost if site data is cleared. Use
> **Settings → Download backup** until there is a server to save to.

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

## Deployment

Served as a static build by nginx at `novastudio.novaceptai.com`, following the
same pattern as `academy.novaceptai.com`.

```bash
deploy/deploy.sh          # type-check, build, publish to /var/www/novastudio
deploy/enable-https.sh    # one-off: issue the certificate and switch to HTTPS
```

`deploy.sh` builds into a scratch directory and only publishes on success,
copying hashed chunks before `index.html` so a browser is never handed a page
that points at files not yet present. Chunks from earlier builds stay for a
week so open tabs can still lazy-load.

The nginx configs live in `deploy/nginx/`: a bootstrap (HTTP only) used until
the certificate exists, and the final HTTPS config. `enable-https.sh` refuses to
run until DNS resolves to this server.

Build output goes to `/static/`, not Vite's default `/assets/`, because
`/assets` is the Asset Library's route; with the default, reloading that page
would hit the directory and 404.

## What it does

| Screen | What it covers |
| --- | --- |
| **Overview** | **Next up**: every action that needs a person, most urgent first — failed steps, blockers, overdue videos, reviews waiting, videos due within a week, unverified sources, then unfinished channel setup. Plus counts per stage, upcoming releases, and per-channel progress. Filtered by the channel selector. |
| **Channels** | All ten channels with setup progress (7 items: audience, tone, formats, duration, cadence, budget, approved sources). Each channel has a setup checklist, idea backlog, schedule, editable configuration, editable branding and voice slots, status, and its intended YouTube handle. |
| **Content Pipeline** | Idea → Research → Script → Audio → Visuals → Editing → Review → Scheduled → Published, as a board or a table. Blocked work and failed jobs are tracked *alongside* the stages, not as stages. Each project opens onto Brief, Research, Script, Audio & Visuals, Review and Publishing tabs. |
| **Calendar** | Month and week views, colour-coded per channel, with drag-to-reschedule. |
| **Asset Library** | A register of thumbnails, images, video, audio and scripts — channel, video, language, licence, source and attribution. Records only; no files are stored yet. |
| **Analytics** | What was published and what it cost, per channel, with Shorts and long-form separated. Views, watch time, CTR, subscribers and revenue need YouTube Analytics and are not shown until it is connected. |
| **Integrations** | YouTube, AWS, ElevenLabs and image/video providers — all "Not connected", each with what it would do and what it needs first. |
| **Settings** | Default language, timezone, currency, review requirements, budget limits; backup download, restore, and clear all data. |

### Things worth knowing

- **Hindi and English are separate tracks on the same project.** A video can be
  script-ready in English while Hindi is still being drafted; the pipeline cards
  show each track's own state.
- **Blocked ≠ a stage.** A project keeps its stage and carries a separate blocker
  or failure, so "where is this" and "is it stuck" stay independent questions.
- **Two rules are enforced on the Scheduled transition** (both switchable in
  Settings): review sign-off, and a verification date on every research source.

## Project structure

```
src/
├── types/          Domain model. Unions and `as const` maps, no enums.
│                   The *_VALUES arrays drive iteration order everywhere.
├── data/           The starting workspace.
│   ├── channels.ts        The ten channels, blank apart from the brief.
│   └── integrations.ts    Integration descriptions and default settings.
├── services/       The API boundary.
│   ├── api.ts             Every screen talks to this and nothing else.
│   └── storage.ts         Guarded localStorage access.
├── store/          Two contexts: loaded data + mutations, and the global
│                   channel/date/search filters.
├── lib/            selectors (pipeline queries and the Next up list),
│                   date, format, utils.
├── components/
│   ├── ui/                Primitives on Radix: button, badge, dialog, tabs,
│   │                      table, field, toast, tooltip, states.
│   ├── common/            Domain pieces: channel avatar, stat tile, badges,
│   │                      page header, notice, filter bar.
│   ├── charts/            Recharts wrappers with one shared visual language.
│   ├── layout/            App shell, sidebar, global search.
│   └── projects/          New-project dialog, board card.
├── pages/          One file per route.
└── styles/         Tailwind layer and the design tokens.
```

### Colour

Each channel owns an accent colour, used for its avatar and calendar entries. The ten were checked with a palette validator: they sit in
one lightness band, clear the chroma floor, and every adjacent pair clears the
colour-vision-deficiency separation threshold against the light surface.

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
| Server-side storage | Records live in one browser. A backend would make them shared and durable; until then, download backups. |

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
