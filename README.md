# ineil77.dev

Personal academic site for Indraneil Paul — a static [Astro](https://astro.build)
site deployed to [Cloudflare Pages](https://pages.cloudflare.com) on the custom
domain **[ineil77.dev](https://ineil77.dev)**.

## Stack

- **Astro 5**, static output (no server runtime).
- **Self-hosted fonts** via Fontsource: Source Serif 4 (display), Source Sans 3
  (body), Source Code Pro (metadata) — the same Source superfamily and British
  Green accent (`#004225`) used in the LaTeX CV, so the site and the document
  read as one identity.
- No UI framework; a little vanilla JS powers the ⌘K command palette, the
  publication filter chips, and the emoji dock scrollspy.

## Content lives in data files

Edit these — every section reads from them; no component markup changes needed:

| File | Drives |
| --- | --- |
| `src/data/site.ts` | Name, role, bio, socials, nav, status, research threads |
| `src/data/publications.ts` | Publication list + filter categories |
| `src/data/news.ts` | News feed |

The bio and news support a `{label|href}` inline-link mini-syntax.

## The CV

`Personal_CV` (private) is checked out by CI into `cv-src/` (its `main` branch,
via `actions/checkout` in `deploy.yml`). Two artifacts are produced from it on
every deploy:

1. **Downloadable PDF** — compiled with **LuaLaTeX** on **TeX Live 2025**
   (pinned via the `texlive/texlive:TL2025-historic` Docker image), served at
   `/cv/indraneil-paul-cv.pdf`.
2. **Web CV** (`/cv`) — `scripts/parse-cv.mjs` parses the fixed-format LaTeX
   sections into `src/generated/cv.json`, rendered by `src/pages/cv.astro` in
   the site's own colors and fonts.

The parser has no dependencies and resolves its source in this order:
`CV_SRC_DIR` env → `./cv-src` → `../Personal_CV` (handy for local dev).

## Local development

```bash
npm install
npm run dev      # runs parse:cv, then astro dev
npm run build    # runs parse:cv, then astro build -> dist/
npm run preview  # serve the built dist/
```

Drop your headshot at `public/profile.jpg` (a placeholder ships in its place).

## Deploy pipeline

Cloudflare's own git build can't run this (private submodule + LaTeX compile),
so **GitHub Actions** does everything and ships `dist/` with `wrangler`
(`.github/workflows/deploy.yml`). It triggers on push to `main`, on
`workflow_dispatch`, and on a `cv-updated` repository dispatch fired by
`Personal_CV` when the CV changes.

### Credentials

CI avoids long-lived personal access tokens. Instead a single **GitHub App**
(installed on both `ineil77.dev` and `Personal_CV`) mints a short-lived,
least-privilege token at the start of each run — used to check out the private
CV submodule, to fire the `cv-updated` dispatch, and to write the rotated
Cloudflare secret. Its permissions: **Contents: Read & write** and
**Secrets: Read & write**.

Set these in **both** repos:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `CI_APP_ID` | The GitHub App's numeric App ID |
| Secret | `CI_APP_PRIVATE_KEY` | A private key (`.pem`) generated for the App |

This repo (`ineil77.dev`) also needs:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | Scoped **Account → Cloudflare Pages → Edit** *and* **User → API Tokens → Edit** (so it can roll itself) |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Target account ID (an identifier, not a secret) |

**Rotation.** The App private key is the only long-lived credential; rotate it
anytime in the App settings (add a new key → update `CI_APP_PRIVATE_KEY` → delete
the old key) with zero downtime. The Cloudflare token rotates itself monthly via
`.github/workflows/rotate-cloudflare-token.yml` — it rolls its own value and
writes the new one back over `CLOUDFLARE_API_TOKEN`. If a roll ever fails
mid-run (Cloudflare invalidates the old value before the new one is stored),
re-create the Pages token by hand and update the secret once.
