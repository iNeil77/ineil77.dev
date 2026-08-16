// Tiny helpers for rendering the content in src/data/*. No dependencies.

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttr = (s: string): string => escapeHtml(s).replace(/"/g, "&quot;");

/**
 * Expand the {label|href} inline-link mini-syntax into anchors, escaping all
 * surrounding text. Links to http(s)/mailto keep the same styling; external
 * links open in a new tab.
 */
export function inline(text: string): string {
  let out = "";
  const re = /\{([^{}|]+)\|([^{}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out += escapeHtml(text.slice(last, m.index));
    const label = escapeHtml(m[1].trim());
    const href = m[2].trim();
    const external = /^https?:/i.test(href);
    const rel = external ? ' target="_blank" rel="noopener"' : "";
    out += `<a href="${escapeAttr(href)}"${rel}>${label}</a>`;
    last = m.index + m[0].length;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

/** Bold the site owner's name wherever it appears in an author list. */
export function highlightAuthor(authors: string, name = "Indraneil Paul"): string {
  const escaped = escapeHtml(authors);
  const needle = escapeHtml(name);
  return escaped.split(needle).join(`<strong>${needle}</strong>`);
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "Jul 2026". */
export function monthYear(iso: string): string {
  const [y, mo] = iso.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[(mo || 1) - 1]} ${y}`;
}
