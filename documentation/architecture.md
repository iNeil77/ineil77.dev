# Architecture

## What this repo is

A static [Astro](https://astro.build) site (Astro 7, no server runtime), Node 24
(`.nvmrc`), deployed to **Cloudflare Pages** via GitHub Actions. It renders both
hand-edited content and data generated from the private `Personal_CV` LaTeX repo.

## Content sources

| Content | Source | Edited by |
| --- | --- | --- |
| Publications (homepage + `/cv`) | `Personal_CV` `\project{}` → `src/generated/cv.json` | the CV, never here |
| CV page timelines / experience | `Personal_CV` sections → `cv.json` | the CV, never here |
| Name, bio, role, socials, nav, status, research threads | `src/data/site.ts` | by hand |
| News feed | `src/data/news.ts` | by hand |

`src/data/publications.ts` is an **adapter** over `cv.json`, not a data file:
it finds the `publications` section, decomposes each venue line into
venue/year/status/award, filters links to the homepage-relevant kinds, and
derives the filter categories. The bio and news support a `{label|href}` inline
mini-syntax (`src/utils/text.ts`).

## Build pipeline (`npm run build`)

Three stages, in order (`package.json`):

1. **`parse:cv`** — `scripts/parse-cv.mjs` (dependency-free). Resolves the CV
   source (`CV_SRC_DIR` env → `./cv-src` → `../Personal_CV`), reads `cv.tex` +
   its `\input` section files, and writes `src/generated/cv.json`
   (`{ available, name, summary, sections[] }`; gitignored, rebuilt every build).
   No source found → an `available:false` placeholder, so the build still
   succeeds and the CV page shows a fallback instead of failing.
2. **`astro build`** — static `dist/` with content-hashed `/_astro/*` assets.
   Pages import `cv.json` directly (`src/pages/cv.astro`, `src/data/publications.ts`).
3. **`csp-hashes.mjs`** — post-build CSP hardening (below).

## CSP hardening (important, non-obvious)

`public/_headers` intentionally ships a **permissive placeholder** CSP
(`script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`).
`scripts/csp-hashes.mjs` runs after `astro build` and rewrites `dist/_headers`:
it replaces `script-src`'s `'unsafe-inline'` with `'self'` + a `sha256` for each
inline `<script>` it finds in `dist/`, and drops `style-src` to `'self'`. If that
step is ever skipped the policy degrades **safely** to the working
inline-permitting placeholder rather than breaking the page.

Consequences to remember:
- **Inspecting `public/_headers` alone is misleading** — the hardened policy only
  exists in `dist/` after the build.
- **Never add an inline `<style>` or an external `<script src>`/CDN.**
  `csp-hashes.mjs` hashes scripts only, so the hardened `style-src 'self'` (no
  hashes) would block inline CSS, and `script-src 'self'` + hashes blocks
  external/CDN scripts. All fonts are self-hosted; there are no external loads.
- Any change to an inline script (even whitespace) changes its hash — the build
  re-hashes automatically, so that's fine.

The production CSP also sets `default-src 'self'`, `img-src 'self' data:`,
`font-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`,
`frame-ancestors 'none'`, `upgrade-insecure-requests`. HSTS
(`max-age=31536000; includeSubDomains`, **no** `preload`) ships in `_headers`
above — it is an app-level header, not a zone setting. The DNS-level hardening
that *does* live in the Cloudflare dashboard is **DNSSEC** (active), **SPF**
(`v=spf1 -all` — the domain sends no mail) and **DMARC** (`p=reject`). **CAA is
not currently configured.** Adding it is a reasonable future step, but the record
must authorize every CA Cloudflare may use for Universal SSL (Let's Encrypt,
Google Trust Services, SSL.com) or automatic cert renewal will break — a missing
CAA is safer than a wrong one.

## Design language

Accent **British Green `#004225`** (lifted from the LaTeX CV so site and
document read as one identity) on warm off-white `#faf9f5`
(`src/styles/global.css`). Type: **Newsreader** (display serif), **Source Sans 3**
(body), **Source Code Pro** (mono/metadata), self-hosted and hand-subsetted to
latin + latin-ext in `src/styles/fonts.css` (regenerate that file if a font
package version changes). No UI framework; small vanilla-JS enhancements (⌘K
palette, publication filter chips, nav scroll-state).

> The headshot is duplicated **by hand**: `public/profile.jpg` (OG/social card)
> and `src/assets/profile.jpg` (on-page `<Picture>`) are byte-identical. Update
> both together or the social card desyncs from the page photo.

## The CV ↔ website coupling contract

The parser reads the CV's **raw LaTeX** directly (there is no `cv.json` in the CV
repo). The two sides share an implicit contract; changing one without the other
silently breaks the render.

**Section typing** keys off the LaTeX environment used:
`\begin{projects}`→publications, `\begin{experiences}`→experience,
`\begin{scholarship}`→timeline (the default for anything unrecognized).

**Resource-link labels** in the parser's `RESLINK_LABELS` mirror the
`\defreslink` labels in `Personal_CV/yaac-another-awesome-cv.cls`. Adding,
renaming, or relabeling a resource kind requires editing **both** files in
lockstep. One deliberate quirk: `repopage` maps to the label **"Event Page"**
(same as `eventpage`) on purpose — don't "fix" one side.

**Hidden metadata**: `\project` blocks carry `tags={A; B}` (homepage filter
chips, semicolon-separated) and optional `id={slug}` (stable cross-link slug) —
they render nothing in the PDF. `researchThreads[].work` in `src/data/site.ts`
references those ids; a thread quick-link that renders nothing is almost always
an **id mismatch** with the CV, not a component bug. Values must contain **no
nested braces** (the parser uses a single-level brace-pair regex).

**Trust boundary**: the parser treats the CV as trusted, author-controlled input.
It HTML-escapes text and emits a fixed tag whitelist, but does **not** sanitize
URL schemes — a `javascript:` href in the CV (or in the `{label|href}` syntax in
`site.ts`/`news.ts`) would render as-is. Safe only because these sources are
author-controlled; add scheme filtering before ever accepting external input.

The authoritative CV-side of this contract (the macro shapes) is documented in
`Personal_CV/documentation/authoring-and-build.md`.
