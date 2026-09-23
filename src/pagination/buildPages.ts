import type { DocumentModel } from "../types/document";
import { THEMES } from "../types/document";
import { htmlToAtoms, measure, paginateAtoms, atomsToBodyHtml, PAGE_H, PAD_TOP, PAD_BOTTOM } from "./paginate";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface BuiltPages {
  pageHtmlList: string[];
  pageCount: number;
}

/**
 * The single canonical builder used by BOTH the Live Preview and the print/
 * export markup — so they can never structurally drift apart. Applies the
 * active template's theme variables, then measures + paginates the editor
 * content against the real (mm-based) page geometry.
 */
export function buildPages(doc: DocumentModel): BuiltPages {
  const theme = THEMES[doc.template];
  const root = document.documentElement.style;
  root.setProperty("--doc-primary", theme.primary);
  root.setProperty("--doc-accent", theme.accent);
  root.setProperty("--doc-body", theme.body);
  root.setProperty("--doc-secondary", theme.secondary);
  root.setProperty("--doc-border", doc.border.color || theme.border);
  root.setProperty("--rule-thickness", doc.redRule.thickness);
  root.setProperty("--rule-width", doc.redRule.width);
  root.setProperty("--border-w", doc.border.thickness);
  root.setProperty("--border-inset-outer", doc.border.insetOuter);
  root.setProperty("--border-inset-inner", doc.border.insetInner);

  const headerHtml = `
    <div class="logo-row">

      ${doc.header.logoDataUrl ? `<img src="${doc.header.logoDataUrl}" style="height:${doc.header.logoHeight || 38}px">` : ""}

      <div class="inst">${escapeHtml(doc.header.institute)}<div class="tagline">${escapeHtml(doc.header.tagline)}</div></div>
    </div>
    <hr>
    <div class="title">${escapeHtml(doc.header.title)}</div>
    <div class="date">${escapeHtml(doc.header.date)}</div>`;

  const atoms = htmlToAtoms(doc.editorHtml);
  const { heights, headerHeight } = measure(atoms, headerHtml);

  const BUFFER = 14; // safety margin for font-rendering variance between screen and print engines
  const capFirst = PAGE_H - PAD_TOP - PAD_BOTTOM - headerHeight - BUFFER;
  const capRest = PAGE_H - PAD_TOP - PAD_BOTTOM - BUFFER;
  const pages = paginateAtoms(atoms, heights, capFirst, capRest);

  const bulletGlyph = doc.bullet.glyph === "-" ? "–" : doc.bullet.glyph;
  const borderClass = doc.border.enabled ? `bordered ${doc.border.style}` : "";

  const pageHtmlList = pages.map((pageAtoms, i) => {
    const isFirst = i === 0;
    const bodyContent = atomsToBodyHtml(pageAtoms, bulletGlyph);
    return `
      <div class="a4-page ${borderClass}">
        ${isFirst ? `<div class="doc-header">${headerHtml}</div>` : ""}
        <div class="doc-body">${bodyContent}</div>
        ${doc.watermark.enabled ? `<div class="doc-watermark">${escapeHtml(doc.watermark.text)}</div>` : ""}
        <div class="doc-footer">
          <span class="fbrand">${escapeHtml(doc.footer.text)}</span>
          ${doc.footer.showPageNumbers ? `<span>Page ${i + 1} of ${pages.length}</span>` : "<span></span>"}
        </div>
      </div>`;
  });

  return { pageHtmlList, pageCount: pages.length };
}
