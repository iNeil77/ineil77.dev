# ineil77.dev

Personal academic site for Indraneil Paul — a static [Astro](https://astro.build)
site deployed to [Cloudflare Pages](https://pages.cloudflare.com) on the custom
domain **[ineil77.dev](https://ineil77.dev)**.

## Stack

- **Astro 7**, static output (no server runtime) — see `package.json`.
- **Self-hosted fonts** via Fontsource, hand-subsetted to latin + latin-ext in
  `src/styles/fonts.css`: **Newsreader** (display serif), **Source Sans 3**
  (body), **Source Code Pro** (metadata/mono). The **British Green** accent
  (`#004225`) is lifted straight from the LaTeX CV so the site and the document
  read as one identity (`src/styles/global.css`).
- No UI framework; a little vanilla JS powers the ⌘K command palette, the
  publication filter chips, and the nav scroll-state.

## Content lives in data files

Edit these — every section reads from them; no component markup changes needed:

| File | Drives |
| --- | --- |
| `src/data/site.ts` | Name, role, bio, socials, nav, status, research threads |
| `src/data/news.ts` | News feed |
| `src/data/publications.ts` | **Adapter only** — derives the homepage list from the CV; not hand-edited |

The bio and news support a `{label|href}` inline-link mini-syntax
(`src/utils/text.ts`).

> **Publications are NOT edited here.** They come from the CV (see below).
> `src/data/publications.ts` is a thin adapter over the generated `cv.json`.

## The CV (single source of truth for publications)

[`Personal_CV`](https://github.com/iNeil77/Personal_CV) (private) is checked out
by CI into `cv-src/` — a **plain `actions/checkout` of its `main` branch** (it
used to be a git submodule; that was removed to drop the stale-pointer footgun).
Two artifacts are produced from it on every deploy:

1. **Downloadable PDF** — compiled with **LuaLaTeX** on **TeX Live 2025**
   (pinned via the `texlive/texlive:TL2025-historic` Docker image), served at
   `/IndraneilCV.pdf` (the old `/cv/indraneil-paul-cv.pdf` path 301-redirects
   there via `public/_redirects`).
2. **Web CV** (`/cv`) — `scripts/parse-cv.mjs` parses the fixed-format LaTeX
   into `src/generated/cv.json` (gitignored, rebuilt each build), rendered by
   `src/pages/cv.astro`. The homepage publication list + research-thread
   cross-links are also derived from that JSON.

The parser is dependency-free and resolves its source in order:
`CV_SRC_DIR` env → `./cv-src` (CI) → `../Personal_CV` (local dev). If none is
found it writes an `available:false` placeholder and the build still succeeds
(the CV page shows a fallback rather than failing).

To edit publications, edit the `\project{...}` blocks in `Personal_CV` — their
hidden `tags={A; B}` / `id={slug}` keys drive the homepage filters and
research-thread links. See that repo's README for the macro contract.

## Local development

```bash
npm install
npm run dev      # runs parse:cv, then astro dev
npm run build    # parse:cv -> astro build -> csp-hashes.mjs  (outputs dist/)
npm run preview  # serve the built dist/
```

Node version is pinned in `.nvmrc` (24); CI reads it via `node-version-file`.
Drop your headshot at both `public/profile.jpg` (OG/social card) **and**
`src/assets/profile.jpg` (on-page `<Picture>`) — they are kept byte-identical by
hand, so update both together or the social card desyncs from the page photo.

## Build pipeline

`npm run build` runs three stages in order:

1. **`parse:cv`** (`scripts/parse-cv.mjs`) — parses the LaTeX CV → `src/generated/cv.json`.
2. **`astro build`** — static `dist/` with content-hashed `/_astro/*` assets.
3. **`csp-hashes.mjs`** — post-build CSP hardening: replaces the placeholder
   `script-src 'self' 'unsafe-inline'` in `dist/_headers` with `'self'` + a
   `sha256` for each inline `<script>`, and drops `style-src` to `'self'`. If
   this step is skipped the policy degrades safely to the working
   inline-permitting placeholder shipped in `public/_headers`.

> `public/_headers` intentionally ships the permissive placeholder CSP; the
> hardened policy only exists in `dist/` after step 3. Inspecting
> `public/_headers` alone is misleading. **Never add an inline `<style>` or an
> external `<script src>`/CDN** without updating the policy — `csp-hashes.mjs`
> hashes scripts only, so the hardened `style-src 'self'` would block inline CSS.

## Deploy pipeline

Cloudflare's own git build can't run this (private CV checkout + LaTeX compile),
so **GitHub Actions** does everything and ships `dist/` with `wrangler`
(`.github/workflows/deploy.yml`). It triggers on:

- push to `main`,
- `workflow_dispatch`, and
- a `cv-updated` `repository_dispatch` fired by `Personal_CV` when the CV changes.

**A push to `main` here is a live production deploy.** After deploy, a
best-effort step purges the Cloudflare edge cache for the canonical URLs (`/`,
`/cv`, `/cv/`, `/IndraneilCV.pdf`); content-hashed `/_astro/*` are immutable and
left alone. It no-ops (with a warning, never failing the deploy) unless
`CLOUDFLARE_ZONE_ID` is set and the token carries Zone → Cache Purge.

`.github/workflows/keepalive.yml` pushes an empty `[skip ci]` commit on the 8th
and 23rd of each month. This is **load-bearing**: the repo is public, so GitHub
auto-disables scheduled workflows after ~60 idle days on the default branch —
the keepalive keeps the monthly token rotation alive. It uses `GITHUB_TOKEN`, so
it does not cascade a deploy.

### Credentials

CI uses no long-lived personal access token. A **GitHub App** (installed on both
`ineil77.dev` and `Personal_CV`) mints a short-lived, least-privilege token at
the start of each run — used to check out the private CV, fire the `cv-updated`
dispatch, and write the rotated Cloudflare secret. App permissions: **Contents:
Read & write** and **Secrets: Read & write**.

Set these in **both** repos:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `CI_APP_CLIENT_ID` | The GitHub App's **client ID** (e.g. `Iv23li…`) |
| Secret | `CI_APP_PRIVATE_KEY` | A private key (`.pem`) generated for the App |

This repo (`ineil77.dev`) also needs:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | **Deploy token** — auto-rotated; carries only `Account → Cloudflare Pages → Edit` + `Zone → Cache Purge`. Do **not** delete it; rotation overwrites it in place. |
| Secret | `CF_ROTATOR_TOKEN` | **Durable rotator** — set once by hand, never rotated. A **USER** token with `Account → Cloudflare Pages → Edit` + `Zone → Cache Purge` + `User → API Tokens → Edit`. |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Target account ID (an identifier, not a secret) |
| Variable | `CLOUDFLARE_ZONE_ID` | Zone ID for the domain (identifier, not a secret) — enables the cache purge |

### Cloudflare token rotation (two-token model)

Cloudflare **forbids an API-minted token from carrying `User → API Tokens →
Edit`** (`POST /user/tokens` → HTTP 400, error code 1001 "sub-token is not
allowed to have permissions to manage other tokens"). So a token can **never**
mint its own replacement — something durable must hold the management
permission. This is the production pattern (the shape Vault/Doppler use): a
privileged rotator, kept out of the deploy path, mints a short-lived,
least-privilege operational token.

`.github/workflows/rotate-cloudflare-token.yml` (monthly cron + `workflow_dispatch`)
uses `CF_ROTATOR_TOKEN` to mint a fresh **deploy-only** copy of
`CLOUDFLARE_API_TOKEN` (Pages·Edit + Cache Purge, no management perm), verifies
its policy matches and it authenticates as active, persists it over the secret,
and only **then** retires the previous deploy token. The old token stays valid
throughout, so a mid-run crash orphans a token at worst — never an outage. The
rotator is never deleted or rotated by the job.

**Rotation runbook.**
- The **App private key** and the **`CF_ROTATOR_TOKEN`** are the only long-lived
  credentials. Rotate the App key anytime in the App settings (add new key →
  update `CI_APP_PRIVATE_KEY` → delete old) with zero downtime.
- Rotate `CF_ROTATOR_TOKEN` manually (~quarterly is ample): create a new USER
  token with the three permissions above, update the secret, delete the old one.
  Optionally give it an `expires_on` backstop.
- If a rotation run ever fails, the old `CLOUDFLARE_API_TOKEN` is still valid —
  deploys keep working. Re-run the workflow (`workflow_dispatch`) once the cause
  is fixed. Check the Cloudflare dashboard for orphaned "auto-rotated" tokens
  and remove any the job couldn't retire.
