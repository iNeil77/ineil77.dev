// Tiny helpers for rendering the content in src/data/*. No dependencies.

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const escapeAttr = (s: string): string => escapeHtml(s).replace(/"/g, "&quot;");

/**
 * Expand two inline mini-syntaxes, escaping all surrounding text:
 *   {label|href}  → anchor (external http(s) links open in a new tab)
 *   **text**      → <strong> (may wrap links; the inner text is re-expanded)
 */
export function inline(text: string): string {
  let out = "";
  const re = /\*\*([\s\S]+?)\*\*|\{([^{}|]+)\|([^{}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out += escapeHtml(text.slice(last, m.index));
    if (m[1] !== undefined) {
      // Bold span — recurse so any {label|href} links inside it expand too.
      out += `<strong>${inline(m[1])}</strong>`;
    } else {
      const label = escapeHtml(m[2].trim());
      const href = m[3].trim();
      const external = /^https?:/i.test(href);
      const rel = external ? ' target="_blank" rel="noopener"' : "";
      out += `<a href="${escapeAttr(href)}"${rel}>${label}</a>`;
    }
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
