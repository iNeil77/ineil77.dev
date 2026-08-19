# Operations & recovery

Everything needed to run and recover this deployment. Trust the workflow files
and this doc over any older prose.

## Deploying

`.github/workflows/deploy.yml` does the whole build+ship (Cloudflare's native git
build can't — private CV checkout + LuaLaTeX). It mints a short-lived GitHub App
token, checks out this repo + `Personal_CV@main` into `cv-src/`, compiles the PDF
in the pinned `texlive/texlive:TL2025-historic` image, stages it to
`public/IndraneilCV.pdf`, runs `npm run build`, deploys `dist/` with `wrangler`,
then purges the edge cache for canonical URLs.

Triggers:
- **push to `main`** — no path filter, so **any push (including docs) deploys.**
- **`workflow_dispatch`**.
- **`cv-updated` `repository_dispatch`** fired by `Personal_CV` when the CV changes.

Both a push and the CV dispatch resolve to `refs/heads/main`, so they share one
serialized concurrency group (`cancel-in-progress: false`) — each deploys fully
instead of cancelling the other.

Watch a run: `gh run watch <id> -R iNeil77/ineil77.dev --exit-status`.

## Keepalive (do not remove)

This repo is **public**, so GitHub auto-disables scheduled workflows after ~60
idle days on the default branch. `.github/workflows/keepalive.yml` pushes an empty
`[skip ci]` commit on the 8th and 23rd of each month to reset that timer and keep
the monthly token rotation alive. It uses `GITHUB_TOKEN`, so it does **not**
cascade a deploy. If token rotation ever silently stops firing, check keepalive first.

## Edge cache behavior (Cloudflare Free plan)

- The Free plan **floors browser-facing `max-age` to 14400s (4h)**. The résumé
  PDF's origin `max-age=300` (`public/_headers`) is silently raised to 4h; you
  can't beat the floor from `_headers` (needs a dashboard Cache Rule or a plan
  upgrade). Values already above 4h (favicon 1d, `/_astro/*` 1y immutable) pass
  through unchanged.
- After a deploy the **origin** updates immediately but the **canonical** URL may
  serve the stale edge copy until it expires. The deploy's final step purges
  `/`, `/cv`, `/cv/`, `/IndraneilCV.pdf` (content-hashed `/_astro/*` are immutable,
  left alone). It's **best-effort** — warns but never fails an otherwise-good
  deploy — and only runs when `CLOUDFLARE_ZONE_ID` is set and the token has
  Zone → Cache Purge.
- **Verify a fresh deploy with a cache-buster** (`?x=<n>`), not the canonical URL:
  a cache-busted fetch shows `cf-cache-status: MISS` and the new content.

## Common tasks

| Task | Where |
| --- | --- |
| Bio / socials / research threads / status | `src/data/site.ts` |
| News item | `src/data/news.ts` |
| Publication | **not here** — edit `Personal_CV/section_publications.tex` |
| Headshot | update **both** `public/profile.jpg` and `src/assets/profile.jpg` |
| Preview CV parsing locally | `CV_SRC_DIR=/path/to/Personal_CV npm run build` |

---

# Credential model

Only **two** long-lived credentials exist: the GitHub App private key and the
Cloudflare rotator token. Everything else is short-lived or auto-rotated.

## Inventory

**Non-secret identifiers** (safe to record; already stored as public repo
variables — knowing them grants no access without the paired secret):

| Identifier | Value | Where it lives |
| --- | --- | --- |
| GitHub App client ID | `Iv23liCuC8mvxFBfHYRy` | `CI_APP_CLIENT_ID` var, **both** repos |
| Cloudflare account ID | `c06eae35cdd27b223ee9585c6680f325` | `CLOUDFLARE_ACCOUNT_ID` var, this repo |
| Cloudflare zone ID | `b944afba7c2495c34c61804081260975` | `CLOUDFLARE_ZONE_ID` var, this repo |

> These can also be re-read anytime from the GitHub App settings and the
> Cloudflare dashboard (domain **Overview → API** for the zone ID); they are not
> the source of truth, just a convenience copy for recovery.

**Secrets** (never in any file — GitHub-managed):

| Secret | Repos | What it is |
| --- | --- | --- |
| `CI_APP_PRIVATE_KEY` | both | GitHub App private key (`.pem`) |
| `CLOUDFLARE_API_TOKEN` | this | **Deploy token**, auto-rotated monthly. Least-privilege: `Account → Cloudflare Pages → Edit` + `Zone → Cache Purge`. **Do not delete** — rotation overwrites it in place. |
| `CF_ROTATOR_TOKEN` | this | **Durable rotator**, set once by hand, never rotated by CI. A **USER** token (not account-owned) with `Account → Cloudflare Pages → Edit` + `Zone → Cache Purge` + `User → API Tokens → Edit`. |

The GitHub App itself needs permissions **Contents: R/W** and **Secrets: R/W**,
installed on both `ineil77.dev` and `Personal_CV`.

## Why the Cloudflare rotation is TWO tokens

`POST /user/tokens` returns **HTTP 400, error code 1001 — "sub-token is not
allowed to have permissions to manage other tokens"** if the token being created
carries `User → API Tokens → Edit`. So an API-minted token can **never** hold
token-management permission, which means a single token can **never** mint its own
replacement. A self-rotating single token is structurally impossible, not a bug to
fix — something durable must hold the management permission. (There is also no
OIDC/federation for Cloudflare deploys; wrangler/API accept only a static bearer
token.)

So `.github/workflows/rotate-cloudflare-token.yml` (monthly cron +
`workflow_dispatch`) uses the durable `CF_ROTATOR_TOKEN`, quarantined from the
deploy path, to mint a fresh **deploy-only** copy of `CLOUDFLARE_API_TOKEN` each
run (Pages·Edit + Cache Purge, derived from the rotator's own non-user-scoped
policies so run 1 == run N). It GET-compares the new token's normalized policy and
verifies it authenticates as active **before** overwriting the secret, then
retires the previous deploy token. The old token stays valid throughout, so a
mid-run crash orphans a token at worst — never an outage. The rotator is never
deleted by the job.

Two implementation points to preserve if editing that workflow:
- The `cf()` curl helper is always called as `x="$(cf …)"`, so its `::error::`
  diagnostics **must** go to **stderr** (`>&2`) — on stdout they'd be captured
  into the variable and the job would die with exit 1 and no visible reason.
- `curl -f` hides the response body on HTTP errors; the helper uses
  `-sS … -w '\n%{http_code}'` and prints Cloudflare's real error object on non-2xx.

---

# Recovery runbooks

## A. A rotation run failed / deploys are 403-ing

The rotation only overwrites `CLOUDFLARE_API_TOKEN` **after** verifying the new
token, so a failed run normally leaves the old (working) token in place — deploys
keep working. Steps:

1. Read the failed run's log (`gh run view <id> -R iNeil77/ineil77.dev --log`) —
   it prints Cloudflare's actual error (thanks to the stderr/body handling above).
2. If deploys are actually 403-ing, the deploy secret is bad. **Manually mint a
   replacement:** Cloudflare dashboard → My Profile → API Tokens → Create Token →
   Custom, with `Account → Cloudflare Pages → Edit` (account
   `c06eae35cdd27b223ee9585c6680f325`) + `Zone → Cache Purge` (zone
   `b944afba7c2495c34c61804081260975`). Copy the value.
3. `printf '%s' '<token>' | gh secret set CLOUDFLARE_API_TOKEN --repo iNeil77/ineil77.dev`
   (or paste via the GitHub web UI — never paste a live token into a chat/transcript).
4. Re-run `Build & Deploy` (`workflow_dispatch`) to confirm.
5. Once healthy, re-run `Rotate Cloudflare deploy token` (`workflow_dispatch`) to
   get back onto the auto-rotation track.
6. Check My Profile → API Tokens for orphaned `ineil77.dev Pages deploy
   (auto-rotated)` tokens and delete any the job couldn't retire.

## B. `CF_ROTATOR_TOKEN` is lost or compromised

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom.
   Make it a **USER** token with `Account → Cloudflare Pages → Edit` +
   `Zone → Cache Purge` + `User → API Tokens → Edit`.
2. Set it: `gh secret set CF_ROTATOR_TOKEN --repo iNeil77/ineil77.dev` (or web UI).
3. Delete the old rotator token in the dashboard.
4. Re-run the rotation workflow to confirm it can still mint a deploy token.

(The workflow no-ops safely if `CF_ROTATOR_TOKEN` is unset — a scheduled run just
logs a warning and exits 0 rather than failing.)

## C. GitHub App private key lost or compromised

Zero-downtime:
1. GitHub App settings → **Generate a new private key**.
2. Update `CI_APP_PRIVATE_KEY` in **both** repos (`gh secret set … < key.pem`).
3. Delete the old key in the App settings.

## D. GitHub App deleted — recreate from scratch

1. Create a new GitHub App under `iNeil77`. Permissions: **Contents: R/W** +
   **Secrets: R/W**.
2. **Install** on both `ineil77.dev` and `Personal_CV`.
3. Copy its **Client ID** → set `CI_APP_CLIENT_ID` **variable** in both repos.
4. Generate a private key → set `CI_APP_PRIVATE_KEY` **secret** in both repos.
5. Re-run `Build & Deploy` and `Build CV` to confirm the token mint + CV dispatch.

## E. All secrets/variables wiped (full rebuild)

Recreate, in this order:
1. GitHub App (runbook D) → sets `CI_APP_CLIENT_ID` + `CI_APP_PRIVATE_KEY` in both.
2. Cloudflare variables: `gh variable set CLOUDFLARE_ACCOUNT_ID --repo iNeil77/ineil77.dev --body c06eae35cdd27b223ee9585c6680f325` and `CLOUDFLARE_ZONE_ID … b944afba7c2495c34c61804081260975`.
3. `CF_ROTATOR_TOKEN` (runbook B).
4. `CLOUDFLARE_API_TOKEN`: either run the rotation workflow (it mints one from the
   rotator) or mint one manually (runbook A step 2–3).
5. Trigger a deploy to confirm end-to-end.

## F. Bad deploy — roll back the site

Cloudflare Pages keeps deployment history. Dashboard → Pages → `ineil77-dev` →
Deployments → pick a known-good deployment → **Rollback** (instant, no rebuild).
Then fix forward in git and push. If the rolled-back content differs at the
canonical URLs, purge the edge cache (the deploy step does this automatically on
the next successful deploy; or purge manually in the dashboard).

## Health check

```bash
gh run list --repo iNeil77/ineil77.dev --limit 5
gh secret list --repo iNeil77/ineil77.dev            # CF_ROTATOR_TOKEN, CI_APP_PRIVATE_KEY, CLOUDFLARE_API_TOKEN
gh variable list --repo iNeil77/ineil77.dev          # CI_APP_CLIENT_ID, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ZONE_ID
```

A recently-updated `CLOUDFLARE_API_TOKEN` `updatedAt` (changing ~monthly) is the
signal that rotation is running.
