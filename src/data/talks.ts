// Invited talks — derived at build time from the LaTeX CV, like publications.ts.
//
// The résumé (Personal_CV) is the single source of truth. `npm run parse:cv`
// reads cv.tex -> src/generated/cv.json; this module adapts that JSON's
// "invited_talks" timeline section into a flat, typed list. The News component
// folds these into the update feed. Add or edit talks in the résumé only.
//
// CV timeline dates are "MM/YY"; we normalise them to ISO first-of-month so the
// News feed can sort and format them alongside the hand-written items.

import cvData from "../generated/cv.json";

export interface Talk {
  /** ISO YYYY-MM-01 (first of the talk's month) */
  date: string;
  title: string;
  venue: string;
  /** slides URL, if the CV entry carried one */
  slides?: string;
}

interface RawEntry {
  date?: string;
  heading?: string;
  links?: { kind: string; href: string }[];
}

// "10/24" -> "2024-10-01". Returns "" for anything that doesn't match.
function isoFromShort(d: string): string {
  const m = /^\s*(\d{1,2})\/(\d{2})\s*$/.exec(d);
  if (!m) return "";
  return `20${m[2]}-${m[1].padStart(2, "0")}-01`;
}

// Headings read "Title, Venue"; split on the LAST comma so titles containing a
// comma stay intact. Any stray inline HTML is stripped (headings are plain text).
function splitHeading(h: string): { title: string; venue: string } {
  const text = h.replace(/<[^>]*>/g, "").trim();
  const i = text.lastIndexOf(",");
  if (i === -1) return { title: text, venue: "" };
  return { title: text.slice(0, i).trim(), venue: text.slice(i + 1).trim() };
}

const section = (cvData as { sections?: { id: string; entries: RawEntry[] }[] })
  .sections?.find((s) => s.id === "invited_talks");

export const talks: Talk[] = (section?.entries || [])
  .map((e) => {
    const { title, venue } = splitHeading(e.heading || "");
    return {
      date: isoFromShort(e.date || ""),
      title,
      venue,
      slides: e.links?.find((l) => l.kind === "slides")?.href,
    };
  })
  .filter((t) => t.date && t.title);
