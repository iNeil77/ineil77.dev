// Homepage publication list — derived at build time from the LaTeX CV.
//
// The résumé (Personal_CV) is the single source of truth. `npm run parse:cv`
// reads cv.tex -> src/generated/cv.json; this module adapts that JSON's
// "publications" section into the shape the homepage components expect. Add or
// edit papers in the résumé only — they flow here on the next build.
//
// Filter tags and a stable cross-link id ride along as hidden key=value pairs
// on each \project (tags={...}, id={...}); they render nothing in the PDF but
// are read by the parser. Venue / year / status / award are decomposed from the
// single venue line the résumé prints (e.g. "ICLR 2025 Oral, Singapore").

import cvData from "../generated/cv.json";

export type LinkKind =
  | "abstract"
  | "pdf"
  | "slides"
  | "code"
  | "demo"
  | "project";

export interface PubLink {
  kind: LinkKind;
  href: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  /** e.g. "Oral", "Poster", "Under Review" */
  status?: string;
  /** e.g. "Outstanding Paper" */
  award?: string;
  /** link to the award certificate, if the \award macro carried a URL */
  awardHref?: string;
  /** category tags — drive the filter chips */
  tags: string[];
  links: PubLink[];
}

// Preferred order of the filter chips. Any tag the résumé uses that isn't
// listed here is appended afterwards in first-seen order.
const CATEGORY_ORDER = [
  "Code LMs",
  "Pre-training",
  "Verifiers & RL",
  "Benchmarks",
  "Detection",
  "Multilingual",
];

// Status keywords lifted out of the venue line into a badge. Most-specific
// (multi-word) first so "Under Review" is matched before any single word.
const STATUSES = ["Under Review", "Oral", "Poster", "Spotlight", "Findings"];

const LINK_KINDS: LinkKind[] = [
  "abstract",
  "pdf",
  "slides",
  "code",
  "demo",
  "project",
];

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");
const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface RawEntry {
  title?: string;
  venue?: string;
  authors?: string;
  tags?: string[];
  id?: string;
  links?: { kind: string; href: string }[];
}

function adapt(entry: RawEntry): Publication {
  const venueHtml = entry.venue || "";
  // Award: the inline link the \award macro renders in the venue — capture both
  // its label ("Outstanding Paper") and its certificate URL, so the homepage
  // badge can link to the certificate.
  const awardMatch = /\(<a\b[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>\)/.exec(venueHtml);
  const award = awardMatch ? collapse(awardMatch[2]) : undefined;
  const awardHref = awardMatch ? awardMatch[1].replace(/&amp;/g, "&") : undefined;

  const venueText = collapse(stripHtml(venueHtml));
  const yearMatch = /\b(?:19|20)\d{2}\b/.exec(venueText);
  const year = yearMatch ? Number(yearMatch[0]) : 0;

  let status: string | undefined;
  for (const s of STATUSES) {
    if (new RegExp(`\\b${s}\\b`).test(venueText)) {
      status = s;
      break;
    }
  }

  // Venue label = the line minus any parenthetical (award / "(Under Review)"),
  // the year, and a bare status word — then tidied of the gaps that leaves.
  let venue = venueText.replace(/\s*\([^)]*\)/g, "");
  venue = venue.replace(/\b(?:19|20)\d{2}\b/, "");
  for (const s of STATUSES) venue = venue.replace(new RegExp(`\\b${s}\\b`), "");
  venue = venue
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "");

  const links: PubLink[] = (entry.links || [])
    .filter(
      (l): l is { kind: LinkKind; href: string } =>
        LINK_KINDS.includes(l.kind as LinkKind)
    )
    .map((l) => ({ kind: l.kind, href: l.href }));

  return {
    id: entry.id || slugify((entry.title || "").split(":")[0]),
    title: collapse(entry.title || ""),
    authors: collapse(stripHtml(entry.authors || "")),
    venue,
    year,
    ...(status ? { status } : {}),
    ...(award ? { award } : {}),
    ...(awardHref ? { awardHref } : {}),
    tags: entry.tags || [],
    links,
  };
}

const pubSection = (cvData as { sections?: { type: string; entries: RawEntry[] }[] })
  .sections?.find((s) => s.type === "publications");

export const publications: Publication[] = (pubSection?.entries || []).map(adapt);

// Filter chips: preferred order first, then any extra tags in first-seen order.
const used = new Set<string>();
for (const p of publications) for (const t of p.tags) used.add(t);
export const pubCategories: string[] = [
  ...CATEGORY_ORDER.filter((c) => used.has(c)),
  ...[...used].filter((c) => !CATEGORY_ORDER.includes(c)),
];
