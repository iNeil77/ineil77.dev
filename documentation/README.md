# ineil77.dev — documentation

Design, processes, and recovery runbooks for this repository. The top-level
[`../README.md`](../README.md) is the overview and quick-start; the files here go
deeper on the parts a future operator or agent needs to run and recover the site
safely.

| Doc | What it covers |
| --- | --- |
| [`architecture.md`](architecture.md) | Site design, the build pipeline, CSP hardening, the design language, and the CV↔website coupling contract |
| [`operations-and-recovery.md`](operations-and-recovery.md) | Deploy triggers, cache behavior, keepalive, the full credential model, the two-token Cloudflare rotation, and **disaster-recovery runbooks** (recreate the App, recover a broken token rotation, restore all secrets) |

## Fast facts

- **Static Astro site** deployed to **Cloudflare Pages** by GitHub Actions.
  Cloudflare's own git build can't run it (private CV checkout + LaTeX compile).
- **Publications are not edited here** — they're generated from the private
  `Personal_CV` LaTeX repo. `src/data/publications.ts` is an adapter, not a
  data file.
- **A push to `main` is a live production deploy** (no path filter).
- **Two long-lived credentials** in the whole system: the GitHub App private key
  and the Cloudflare rotator token. Everything else is short-lived or
  auto-rotated. Do **not** delete `CLOUDFLARE_API_TOKEN`.
