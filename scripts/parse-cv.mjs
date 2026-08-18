// Parse the LaTeX CV (Personal_CV) into structured JSON for the /cv web page.
//
// Source resolution order:
//   1. ./cv-src            (CI checkout of the private CV repo, used in CI + prod)
//   2. ../Personal_CV      (sibling clone, convenient for local dev)
//   3. CV_SRC_DIR env var  (explicit override)
// If none is found, a minimal placeholder is written so `astro build` still runs.
//
// The CV uses a small, fixed set of macros from yaac-another-awesome-cv.cls:
//   \sectionTitle{title}{icon}
//   \begin{scholarship} \scholarshipentry[reslinks]{date}{desc} ...       -> "timeline"
//   \begin{experiences} \experience{date}{head}{body}{tags} ...           -> "experience"
//   \begin{projects}    \project{title}{venue}{authors}{reslinks} ...     -> "publications"
// Resource links are OPTIONAL, named key=value pairs (see \reslinks in the
// .cls): slides={url}, abstract={url}, pdf={url}, demo, project, code,
// enrolment, certificate, eventpage, repopage, email={addr}. Only the keys
// present render. Venues may carry an inline \award{url}{label}.
// plus inline \textbf \texttt \textsc \emph \textcolor \href and \…Symbol.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src", "generated", "cv.json");

function resolveCvDir() {
  const candidates = [
    process.env.CV_SRC_DIR,
    path.join(ROOT, "cv-src"),
    path.resolve(ROOT, "..", "Personal_CV"),
  ].filter(Boolean);
  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, "cv.tex"))) return dir;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Low-level LaTeX scanning helpers
// ---------------------------------------------------------------------------

function stripComments(s) {
  return s
    .split("\n")
    .map((line) => {
      let out = "";
      let esc = false;
      for (const c of line) {
        if (esc) {
          out += "\\" + c;
          esc = false;
          continue;
        }
        if (c === "\\") {
          esc = true;
          continue;
        }
        if (c === "%") break;
        out += c;
      }
      if (esc) out += "\\";
      return out;
    })
    .join("\n");
}

// Read a balanced {...} group; `i` must point at the opening brace.
function readGroup(s, i) {
  if (s[i] !== "{") return null;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") {
      j++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return { content: s.slice(i + 1, j), end: j + 1 };
    }
  }
  return null;
}

function skipSpaces(s, i) {
  while (i < s.length && /\s/.test(s[i])) i++;
  return i;
}

// Skip an optional [...] argument if present.
function skipOptional(s, i) {
  i = skipSpaces(s, i);
  if (s[i] !== "[") return i;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === "[") depth++;
    else if (s[j] === "]") {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return i;
}

// Find the next `\macro` (not followed by a letter) at or after `from`.
function indexOfMacro(s, macro, from) {
  let idx = from;
  while (true) {
    const at = s.indexOf(macro, idx);
    if (at === -1) return -1;
    const next = s[at + macro.length];
    if (next === undefined || !/[a-zA-Z]/.test(next)) return at;
    idx = at + macro.length;
  }
}

// Read `argc` brace groups starting at `i` (skipping whitespace between them).
function readArgs(s, i, argc) {
  const args = [];
  let j = i;
  for (let k = 0; k < argc; k++) {
    j = skipSpaces(s, j);
    if (s[j] !== "{") break;
    const g = readGroup(s, j);
    if (!g) break;
    args.push(g.content);
    j = g.end;
  }
  return { args, end: j };
}

function findEntries(tex, macro, argc) {
  const token = "\\" + macro;
  const out = [];
  let idx = 0;
  while (true) {
    const at = indexOfMacro(tex, token, idx);
    if (at === -1) break;
    const after = at + token.length;
    const { args, end } = readArgs(tex, after, argc);
    out.push(args);
    idx = end > after ? end : after + 1;
  }
  return out;
}

// Read a balanced [...] group; `i` must point at the opening bracket. A ']'
// inside a nested {...} (e.g. a URL, though ours have none) does not close it.
function readBracket(s, i) {
  if (s[i] !== "[") return null;
  let bdepth = 0; // brace depth
  let sdepth = 0; // square-bracket depth
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === "\\") {
      j++;
      continue;
    }
    if (c === "{") bdepth++;
    else if (c === "}") bdepth--;
    else if (bdepth === 0 && c === "[") sdepth++;
    else if (bdepth === 0 && c === "]") {
      sdepth--;
      if (sdepth === 0) return { content: s.slice(i + 1, j), end: j + 1 };
    }
  }
  return null;
}

// \scholarshipentry[<reslinks>]{date}{desc}: capture the optional key=value
// link list plus the two mandatory args.
function findScholarshipEntries(tex) {
  const token = "\\scholarshipentry";
  const out = [];
  let idx = 0;
  while (true) {
    const at = indexOfMacro(tex, token, idx);
    if (at === -1) break;
    let j = skipSpaces(tex, at + token.length);
    let opt = "";
    if (tex[j] === "[") {
      const b = readBracket(tex, j);
      if (b) {
        opt = b.content;
        j = b.end;
      }
    }
    const { args, end } = readArgs(tex, j, 2);
    out.push({ opt, args });
    idx = end > j ? end : j + 1;
  }
  return out;
}

// Resource-link key -> visible label, mirroring the \defreslink lines in the
// .cls so the web chips read exactly like the PDF.
const RESLINK_LABELS = {
  slides: "Slides",
  abstract: "Abstract",
  pdf: "PDF",
  demo: "Demo",
  project: "Project",
  code: "Code",
  enrolment: "Enrolment",
  certificate: "Certificate",
  eventpage: "Event Page",
  repopage: "Event Page",
  email: "Email",
};

// Parse a keyval string like "slides={url}, abstract={url}, email={addr}" into
// [{ label, href, kind }]. Values are usually brace-wrapped (protecting the
// commas/= inside URLs); a bare value runs to the next top-level comma.
function parseReslinks(str) {
  const out = [];
  if (!str) return out;
  const n = str.length;
  let i = 0;
  while (i < n) {
    while (i < n && /[\s,]/.test(str[i])) i++;
    if (i >= n) break;
    const km = /^[a-zA-Z]+/.exec(str.slice(i));
    if (!km) {
      i++;
      continue;
    }
    const key = km[0].toLowerCase();
    i += km[0].length;
    i = skipSpaces(str, i);
    if (str[i] !== "=") continue;
    i = skipSpaces(str, i + 1);
    let value;
    if (str[i] === "{") {
      const g = readGroup(str, i);
      if (!g) break;
      value = g.content;
      i = g.end;
    } else {
      const start = i;
      let depth = 0;
      while (i < n) {
        const c = str[i];
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (c === "," && depth === 0) break;
        i++;
      }
      value = str.slice(start, i);
    }
    value = value.trim();
    const label = RESLINK_LABELS[key];
    if (!label || !value) continue;
    const href = key === "email" ? `mailto:${value}` : value;
    out.push({ label, href, kind: key });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Inline LaTeX -> HTML / text
// ---------------------------------------------------------------------------

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s) => escapeHtml(s).replace(/"/g, "&quot;");
const collapse = (s) => s.replace(/[ \t\n]+/g, " ").trim();
const stripTags = (s) => s.replace(/<[^>]*>/g, "");

const WRAP = {
  textbf: "strong",
  textsc: "span-sc",
  textit: "em",
  emph: "em",
  texttt: "code",
  underline: "u",
  textrm: null,
};

// Convert a LaTeX fragment. Returns { html, links }.
// opts.inlineLinks: when false, \href anchor text is dropped from the html but
// the link is still collected (used to peel "resource" chips off a heading).
function convert(fragment, opts = {}) {
  const inlineLinks = opts.inlineLinks !== false;
  const links = [];
  let out = "";
  let i = 0;
  while (i < fragment.length) {
    const c = fragment[i];

    if (c === "\\") {
      const m = /^\\([a-zA-Z]+)\*?/.exec(fragment.slice(i));
      if (!m) {
        const next = fragment[i + 1];
        const map = { "&": "&amp;", "%": "%", _: "_", "#": "#", "{": "{", "}": "}", $: "$" };
        if (next in map) {
          out += map[next];
          i += 2;
          continue;
        }
        if (next === "\\") {
          out += " ";
          i += 2;
          continue;
        }
        i += 1;
        continue;
      }
      const name = m[1];
      let j = i + m[0].length;

      if (name === "href") {
        const a1 = readGroup(fragment, skipSpaces(fragment, j));
        if (!a1) {
          i = j;
          continue;
        }
        const a2 = readGroup(fragment, skipSpaces(fragment, a1.end));
        if (!a2) {
          i = a1.end;
          continue;
        }
        const url = collapse(stripTags(convert(a1.content, { inlineLinks: true }).html));
        const label = collapse(stripTags(convert(a2.content, { inlineLinks: true }).html));
        links.push({ label, href: url });
        if (inlineLinks && label) out += `<a href="${escapeAttr(url)}">${escapeHtml(label)}</a>`;
        i = a2.end;
        continue;
      }

      if (name === "textcolor") {
        const a1 = readGroup(fragment, skipSpaces(fragment, j)); // color (drop)
        if (!a1) {
          i = j;
          continue;
        }
        const a2 = readGroup(fragment, skipSpaces(fragment, a1.end));
        if (!a2) {
          i = a1.end;
          continue;
        }
        const inner = convert(a2.content, opts);
        out += inner.html;
        links.push(...inner.links);
        i = a2.end;
        continue;
      }

      // \award{url}{label} — a paper award shown inline in the venue, e.g.
      // "ACL 2024 Oral, Bangkok (Outstanding Paper)". Rendered as a
      // parenthesised inline link; not peeled into the resource chips.
      if (name === "award") {
        const a1 = readGroup(fragment, skipSpaces(fragment, j)); // url
        if (!a1) {
          i = j;
          continue;
        }
        const a2 = readGroup(fragment, skipSpaces(fragment, a1.end)); // label
        if (!a2) {
          i = a1.end;
          continue;
        }
        const url = collapse(stripTags(convert(a1.content, { inlineLinks: true }).html));
        const label = collapse(stripTags(convert(a2.content, { inlineLinks: true }).html));
        links.push({ label, href: url });
        if (inlineLinks && label)
          out += ` (<a href="${escapeAttr(url)}">${escapeHtml(label)}</a>)`;
        i = a2.end;
        continue;
      }

      if (name in WRAP) {
        const g = readGroup(fragment, skipSpaces(fragment, j));
        if (!g) {
          i = j;
          continue;
        }
        const inner = convert(g.content, opts);
        const tag = WRAP[name];
        if (tag === "span-sc") out += `<span class="sc">${inner.html}</span>`;
        else if (tag) out += `<${tag}>${inner.html}</${tag}>`;
        else out += inner.html;
        links.push(...inner.links);
        i = g.end;
        continue;
      }

      // Macros with args we drop entirely (spacing / graphics).
      if (["hspace", "vspace", "includegraphics", "scalerel", "rule"].includes(name)) {
        j = skipOptional(fragment, j);
        const g = readGroup(fragment, skipSpaces(fragment, j));
        i = g ? g.end : j;
        continue;
      }

      // Everything else (\hfill, \null, \medskip, \enspace, \quad, \faXxx,
      // \…Symbol, \noindent, …): drop the token, keep going.
      i = j;
      continue;
    }

    if (c === "{") {
      const g = readGroup(fragment, i);
      if (g) {
        const inner = convert(g.content, opts);
        out += inner.html;
        links.push(...inner.links);
        i = g.end;
        continue;
      }
    }
    if (c === "}") {
      i++;
      continue;
    }
    if (c === "&") {
      out += "&amp;";
      i++;
      continue;
    }
    if (c === "<") {
      out += "&lt;";
      i++;
      continue;
    }
    if (c === ">") {
      out += "&gt;";
      i++;
      continue;
    }
    if (c === "~") {
      out += " ";
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return { html: out, links };
}

const toHtml = (s) => collapse(convert(s, { inlineLinks: true }).html);
const toText = (s) => collapse(stripTags(convert(s, { inlineLinks: true }).html));
// Heading html with resource links peeled off into chips.
function headingAndLinks(s) {
  const r = convert(s, { inlineLinks: false });
  return { html: collapse(r.html), links: dedupeLinks(r.links) };
}

function dedupeLinks(links) {
  const seen = new Set();
  const out = [];
  for (const l of links) {
    if (!l.href) continue;
    const key = l.href + "|" + l.label;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Section parsers
// ---------------------------------------------------------------------------

function sectionTitle(tex) {
  const at = indexOfMacro(tex, "\\sectionTitle", 0);
  if (at === -1) return null;
  const { args } = readArgs(tex, at + "\\sectionTitle".length, 2);
  return args[0] ? toText(args[0]) : null;
}

function detectType(tex) {
  if (tex.includes("\\begin{projects}")) return "publications";
  if (tex.includes("\\begin{experiences}")) return "experience";
  if (tex.includes("\\begin{scholarship}")) return "timeline";
  return "timeline";
}

function parseTimeline(tex) {
  return findScholarshipEntries(tex).map(({ opt, args }) => {
    const [date, desc] = args;
    const { html, links } = headingAndLinks(desc || "");
    const optLinks = parseReslinks(opt);
    // opt links (the new explicit form) first; keep any stray inline links too.
    return {
      date: toText(date || ""),
      heading: html,
      links: dedupeLinks([...optLinks, ...links]),
    };
  });
}

function parseExperience(tex) {
  return findEntries(tex, "experience", 4).map(([date, head, body, tags]) => {
    const bullets = parseItemize(body || "");
    const tagList = (findEntries(tags || "", "textbf", 1) || [])
      .map(([t]) => toText(t || ""))
      .filter(Boolean);
    return {
      date: toText(date || ""),
      heading: toHtml(head || ""),
      bullets,
      tags: tagList,
    };
  });
}

function parseItemize(body) {
  // Grab the content between \begin{itemize} and \end{itemize} if present.
  const begin = body.indexOf("\\begin{itemize}");
  const end = body.indexOf("\\end{itemize}");
  let inner = begin !== -1 && end !== -1 ? body.slice(begin + "\\begin{itemize}".length, end) : body;
  inner = skipInlineOptional(inner);
  return inner
    .split("\\item")
    .map((s) => toHtml(s))
    .map((s) => s.trim())
    .filter(Boolean);
}

// remove a leading [...] optional arg (e.g. \begin{itemize}[...])
function skipInlineOptional(s) {
  const t = s.replace(/^\s+/, "");
  if (t[0] !== "[") return s;
  const end = t.indexOf("]");
  return end === -1 ? s : t.slice(end + 1);
}

// Pull a single {…}-wrapped value out of a reslinks string for a key the PDF
// renders nothing for (tags, id — see the hidden \define@key lines in the
// .cls). parseReslinks skips these because they carry no RESLINK_LABELS entry,
// so we read them here instead. The key must sit on a token boundary so "id"
// never matches inside "slides", etc.
function extractKey(str, key) {
  const m = new RegExp(`(?:^|[,{\\s])${key}\\s*=\\s*\\{([^{}]*)\\}`).exec(str);
  return m ? collapse(m[1]) : "";
}

// tags={A; B; C} -> ["A","B","C"] (semicolon-separated homepage filter groups).
function extractTags(str) {
  const raw = extractKey(str, "tags");
  return raw ? raw.split(";").map((s) => collapse(s)).filter(Boolean) : [];
}

function parsePublications(tex) {
  return findEntries(tex, "project", 4).map(([title, venue, authors, reslinks]) => ({
    title: toText(title || ""),
    // Venue keeps any inline \award{...} link; resource chips come from the
    // explicit key=value list only.
    venue: toHtml(venue || ""),
    authors: toHtml(authors || ""),
    // Hidden metadata for the homepage publication list (not rendered on /cv).
    tags: extractTags(reslinks || ""),
    id: extractKey(reslinks || "", "id"),
    links: dedupeLinks(parseReslinks(reslinks || "")),
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function idFromFile(file) {
  return file.replace(/^section_/, "").replace(/\.tex$/, "");
}

function main() {
  const cvDir = resolveCvDir();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  if (!cvDir) {
    console.warn(
      "[parse-cv] No CV source found (cv-src/ or ../Personal_CV). Writing placeholder."
    );
    fs.writeFileSync(
      OUT,
      JSON.stringify(
        { available: false, name: "Indraneil Paul", summary: "", sections: [] },
        null,
        2
      )
    );
    return;
  }

  console.log(`[parse-cv] Reading CV from ${cvDir}`);
  const main = stripComments(fs.readFileSync(path.join(cvDir, "cv.tex"), "utf8"));

  // Name
  let name = "Indraneil Paul";
  const nameAt = indexOfMacro(main, "\\name", 0);
  if (nameAt !== -1) {
    const { args } = readArgs(main, nameAt + "\\name".length, 2);
    if (args.length === 2) name = collapse([args[0], args[1]].map(toText).join(" "));
  }

  // Summary: text between \makecvheader and the first \vspace or \input.
  let summary = "";
  const hdr = main.indexOf("\\makecvheader");
  if (hdr !== -1) {
    const rest = main.slice(hdr + "\\makecvheader".length);
    const stop = rest.search(/\\vspace|\\input/);
    summary = toHtml((stop === -1 ? rest : rest.slice(0, stop)).replace(/^[}\s]+/, ""));
  }

  // Sections, in the order they are \input in cv.tex.
  const order = [];
  const re = /\\input\{([^}]+)\}/g;
  let mm;
  while ((mm = re.exec(main))) order.push(mm[1].trim());

  const sections = [];
  for (const entry of order) {
    const file = entry.endsWith(".tex") ? entry : entry + ".tex";
    const full = path.join(cvDir, file);
    if (!fs.existsSync(full)) {
      console.warn(`[parse-cv] Missing section file: ${file}`);
      continue;
    }
    const tex = stripComments(fs.readFileSync(full, "utf8"));
    const type = detectType(tex);
    const title = sectionTitle(tex) || idFromFile(file);
    let entries = [];
    if (type === "publications") entries = parsePublications(tex);
    else if (type === "experience") entries = parseExperience(tex);
    else entries = parseTimeline(tex);
    if (entries.length) sections.push({ id: idFromFile(file), title, type, entries });
  }

  const data = { available: true, name, summary, sections };
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  const total = sections.reduce((n, s) => n + s.entries.length, 0);
  console.log(
    `[parse-cv] Wrote ${OUT} — ${sections.length} sections, ${total} entries.`
  );
}

main();
