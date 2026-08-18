// Post-build: harden the Content-Security-Policy in dist/_headers.
//
// Astro inlines its interactive bits as inline <script> blocks, so the shipped
// public/_headers uses a placeholder `script-src 'self' 'unsafe-inline'`. Here
// we hash every inline <script> in the built HTML and rewrite the policy to
// allow exactly those hashes — dropping 'unsafe-inline' from both script-src
// and style-src (the site ships no inline <style>). <script type="application/
// ld+json"> is a data block, not executable, so it is exempt and skipped.
//
// If the placeholder isn't found (e.g. already hardened), we warn and leave the
// file untouched rather than failing the build.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const DIST = "dist";
const HEADERS = join(DIST, "_headers");

function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) htmlFiles(p, acc);
    else if (entry.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const scriptTag = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const hashes = new Set();

for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  let m;
  while ((m = scriptTag.exec(html)) !== null) {
    const attrs = m[1] || "";
    const body = m[2];
    if (/\bsrc\s*=/i.test(attrs)) continue;                       // external script
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue; // data, exempt
    if (body.trim() === "") continue;                             // empty
    const digest = createHash("sha256").update(body, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
}

let headers = readFileSync(HEADERS, "utf8");
const before = headers;

const scriptSrc = ["'self'", ...hashes].join(" ");
headers = headers.replace("script-src 'self' 'unsafe-inline'", `script-src ${scriptSrc}`);
headers = headers.replace("style-src 'self' 'unsafe-inline'", "style-src 'self'");

if (headers === before) {
  console.warn(
    "[csp-hashes] No 'unsafe-inline' placeholder found in dist/_headers — CSP left unchanged."
  );
} else {
  writeFileSync(HEADERS, headers);
  console.log(
    `[csp-hashes] Hardened CSP: ${hashes.size} inline-script hash(es) in script-src; style-src → 'self'.`
  );
}
