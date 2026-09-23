/**
 * Normalizes raw PDF-extracted text without altering any facts, numbers,
 * dates or names. Operates purely on whitespace/line-wrap structure.
 */

// Fixes hyphenation caused by a PDF line-wrap, e.g. "environ-\nmental" -> "environmental".
// Only triggers when the break looks like a mid-word wrap (lowercase before the
// hyphen, lowercase continuing after) so genuine hyphenated words are untouched.
function fixHyphenation(text: string): string {
  return text.replace(/([a-z])-\n([a-z])/g, "$1$2");
}

// Collapses runs of spaces/tabs into one, and trims stray spaces before punctuation.
function collapseSpaces(line: string): string {
  return line
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?%])/g, "$1")
    .replace(/([,.;:!?])(?=\S)(?!['")\]])/g, "$1 ")
    .trim();
}

// Collapses 3+ consecutive blank lines down to a single paragraph-break blank line.
function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

/**
 * Rejoins a paragraph that a PDF wrapped across multiple lines. A line is
 * treated as a genuine wrap-continuation (and joined to the previous line)
 * only when the previous line does NOT end with sentence-ending punctuation
 * and the current line does NOT look like a new bullet/heading/label. This
 * avoids merging two separate bullets, headings, or paragraphs.
 */
export function reconstructParagraphs(rawLines: string[]): string[] {
  const out: string[] = [];
  for (let raw of rawLines) {
    const line = collapseSpaces(raw);
    if (!line) {
      out.push("");
      continue;
    }
    const prev = out.length ? out[out.length - 1] : "";
    const prevEndsSentence = /[.:;!?]["')\]]?$/.test(prev);
    const looksLikeNewBlock =
      /^(→|●|•|✓|-|\*|\d+[.)])\s/.test(line) || // bullet / numbered point
      (line === line.toUpperCase() && /[A-Z]/.test(line) && line.length < 70); // heading-like

    if (prev && !prevEndsSentence && !looksLikeNewBlock && !/^(→|●|•|✓|-|\*)/.test(prev)) {
      out[out.length - 1] = `${prev} ${line}`.trim();
    } else {
      out.push(line);
    }
  }
  return out;
}

export function normalizeExtractedText(raw: string): string {
  const hyphenFixed = fixHyphenation(raw);
  const blankCollapsed = collapseBlankLines(hyphenFixed);
  return blankCollapsed;
}

export function looksLikeHeading(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 70) return false;
  if (/^(→|●|•|-|\*)/.test(t)) return false;
  const letters = t.replace(/[^A-Za-z]/g, "");
  const isUpper = letters.length > 2 && t === t.toUpperCase() && /[A-Z]/.test(t);
  const isNumbered = /^\d+[.)]\s+[A-Z]/.test(t);
  return isUpper || isNumbered;
}

export function isBulletLine(line: string): boolean {
  return /^(→|●|•|✓|-|\*)\s*/.test(line.trim());
}

export function detectDate(text: string): string {
  const patterns = [
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return "";
}

/**
 * Separates a leading document-title / date banner (document METADATA) from
 * real body content, so it can populate the Header fields instead of also
 * becoming the first body heading (avoids the duplicated title/date bug).
 */
export function stripLeadingMetadata(lines: string[]): {
  body: string[];
  metadataTitle: string;
  metadataDate: string;
} {
  const body = [...lines];
  const removed: string[] = [];
  let i = 0;
  while (i < body.length && removed.length < 3) {
    const line = body[i].trim();
    if (!line) {
      i++;
      continue;
    }
    const d = detectDate(line);
    const isDateOnly = !!d && line.replace(d, "").trim().length === 0;
    const isTitleBanner = looksLikeHeading(line) && /(current affairs|daily|notes|bulletin|digest|edition)/i.test(line);
    if (isDateOnly || isTitleBanner) {
      removed.push(line);
      i++;
    } else {
      break;
    }
  }
  const metadataTitle = removed.find((l) => !detectDate(l) || l.replace(detectDate(l), "").trim().length > 0) || "";
  const metadataDate = removed.find((l) => detectDate(l)) || "";
  return { body: body.slice(i), metadataTitle, metadataDate };
}

const LABEL_RE =
  /\b(Composition|Purpose|Chairperson|Functions|Nodal Ministry|India'?s Rank|Key Parameters|Kigali Amendment|Investigation|Term|Introduced|Launched|Released)\s*:/;

export function boldLabel(escapedText: string): string {
  return escapedText.replace(new RegExp(LABEL_RE, "i"), (_m, p1) => `<b>${p1}:</b>`);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Filters out repeated running header/footer noise from the source PDF itself
// (e.g. "Daily Current Affairs Notes • 21 September 2026 • Typed Edition • Page 1"),
// which otherwise leaks into the body as unrelated paragraphs.
export function isRunningHeaderFooterNoise(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/page\s+\d+(\s+of\s+\d+)?\s*$/i.test(t) && t.length < 110 && /•/.test(t)) return true;
  return false;
}

/**
 * Full pipeline: raw PDF page text -> cleaned, structured HTML for the editor.
 * Returns the body HTML plus detected metadata title/date.
 */
export function buildEditorHtmlFromText(fullText: string): {
  html: string;
  metadataTitle: string;
  metadataDate: string;
} {
  const normalized = normalizeExtractedText(fullText);
  const rawLines = normalized.split("\n");
  const reconstructed = reconstructParagraphs(rawLines).filter((l) => l.trim());
  const cleaned = reconstructed.filter((l) => !isRunningHeaderFooterNoise(l));
  const { body, metadataTitle, metadataDate } = stripLeadingMetadata(cleaned);

  let html = "";
  let inList = false;
  body.forEach((line) => {
    if (looksLikeHeading(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2>${escapeHtml(line.replace(/^\d+[.)]\s*/, ""))}</h2>`;
    } else if (isBulletLine(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const clean = line.replace(/^(→|●|•|✓|-|\*)\s*/, "");
      html += `<li>${boldLabel(escapeHtml(clean))}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${boldLabel(escapeHtml(line))}</p>`;
    }
  });
  if (inList) html += "</ul>";

  return { html, metadataTitle, metadataDate };
}
