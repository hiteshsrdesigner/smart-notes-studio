/**
 * PAGINATION ENGINE
 *
 * One canonical document model drives both the Live Preview and the print/
 * export markup. Editor HTML is flattened into flat "atoms" (heading /
 * paragraph / single list-item), each atom's real rendered height is
 * MEASURED off-screen at true A4 size (mm, converted to the CSS reference
 * px used by both screen and print), then atoms are packed onto pages until
 * the actual content area is full — never by counting blocks.
 *
 * A heading atom carries its Red Rule (if any) as part of the SAME atom, so
 * heading + rule + its first following atom are always kept together across
 * a page break (never split across pages).
 */

// mm -> CSS reference px, the exact ratio (96px/inch ÷ 25.4mm/inch) browsers
// use to lay out `mm` units — identical for screen layout and print layout.
const MM = 96 / 25.4;

export const PAGE_W = 210 * MM;
export const PAGE_H = 297 * MM;
export const PAD_TOP = 10 * MM;
export const PAD_SIDE = 12 * MM;
export const PAD_BOTTOM = 17 * MM;
export const CONTENT_W = PAGE_W - PAD_SIDE * 2;

export type Atom =
  | { type: "heading"; tag: "h1" | "h2"; html: string; ruleHtml: string }
  | { type: "li"; tag: "ul" | "ol"; html: string }
  | { type: "p"; html: string };

/** Parses editor HTML (from TipTap) into flat atoms, folding a heading's
 * immediately-following <hr class="heading-rule"> into the heading atom. */
export function htmlToAtoms(html: string): Atom[] {
  const container = document.createElement("div");
  container.innerHTML = html;
  const children = [...container.children];
  const atoms: Atom[] = [];
  let i = 0;
  while (i < children.length) {
    const n = children[i];
    const tag = n.tagName.toLowerCase();
    if (tag === "h1" || tag === "h2") {
      let ruleHtml = "";
      const next = children[i + 1];
      if (next && next.tagName === "HR" && next.classList.contains("heading-rule")) {
        ruleHtml = '<hr class="heading-rule">';
        i++;
      }
      atoms.push({ type: "heading", tag: tag as "h1" | "h2", html: n.innerHTML, ruleHtml });
    } else if (tag === "ul" || tag === "ol") {
      [...n.children].forEach((li) => atoms.push({ type: "li", tag: tag as "ul" | "ol", html: (li as HTMLElement).innerHTML }));
    } else if (tag === "p") {
      if (n.innerHTML.trim() && n.innerHTML !== "<br>") atoms.push({ type: "p", html: n.innerHTML });
    } else if (tag !== "hr") {
      atoms.push({ type: "p", html: n.innerHTML });
    }
    i++;
  }
  return atoms;
}

function buildAtomEl(atom: Atom): HTMLElement {
  if (atom.type === "li") {
    const el = document.createElement(atom.tag);
    const li = document.createElement("li");
    li.innerHTML = atom.html;
    el.appendChild(li);
    return el;
  }
  if (atom.type === "heading") {
    const el = document.createElement("div");
    el.innerHTML = `<${atom.tag}>${atom.html}</${atom.tag}>${atom.ruleHtml}`;
    return el;
  }
  const el = document.createElement("p");
  el.innerHTML = atom.html;
  return el;
}

export interface MeasureResult {
  heights: number[];
  headerHeight: number;
}

/**
 * Measures each atom's real rendered height off-screen at true content
 * width. Every atom is wrapped with `display: flow-root` so its own
 * top/bottom margins are fully captured (instead of collapsing through into
 * the measuring box) — without this, measured heights under-count real
 * vertical space and content can silently overflow the page.
 */
export function measure(atoms: Atom[], headerHtml: string | null): MeasureResult {
  const box = document.createElement("div");
  box.style.cssText = `position:absolute;left:-9999px;top:0;width:${CONTENT_W}px;visibility:hidden;font-family:var(--doc-font);`;
  box.className = "doc-body";
  document.body.appendChild(box);

  let headerHeight = 0;
  if (headerHtml !== null) {
    const hdr = document.createElement("div");
    hdr.className = "doc-header";
    hdr.innerHTML = headerHtml;
    hdr.style.cssText = `position:absolute;left:-9999px;top:0;width:${CONTENT_W}px;visibility:hidden;display:flow-root;`;
    document.body.appendChild(hdr);
    headerHeight = hdr.getBoundingClientRect().height + 14; // + doc-header margin-bottom
    document.body.removeChild(hdr);
  }

  const heights = atoms.map((atom) => {
    const el = buildAtomEl(atom);
    el.style.display = "flow-root";
    box.appendChild(el);
    return el.getBoundingClientRect().height;
  });
  document.body.removeChild(box);
  return { heights, headerHeight };
}

/**
 * Packs atoms onto pages. A heading atom only triggers a page break if it
 * (plus the atom right after it — its first bullet/paragraph) doesn't fit in
 * the remaining space of the current page; this is what stops a heading
 * being stranded alone at the bottom of a page.
 */
export function paginateAtoms(atoms: Atom[], heights: number[], capFirst: number, capRest: number): Atom[][] {
  const pages: Atom[][] = [];
  let cur: Atom[] = [];
  let used = 0;
  let cap = capFirst;
  for (let i = 0; i < atoms.length; i++) {
    const h = heights[i];
    const keepsNext = atoms[i].type === "heading" && i + 1 < atoms.length;
    const required = keepsNext ? h + heights[i + 1] : h;
    if (cur.length > 0 && used + required > cap) {
      pages.push(cur);
      cur = [];
      used = 0;
      cap = capRest;
    }
    cur.push(atoms[i]);
    used += h;
  }
  if (cur.length) pages.push(cur);
  if (!pages.length) pages.push([]);
  return pages;
}

export function atomsToBodyHtml(pageAtoms: Atom[], bulletGlyph: string): string {
  let html = "";
  let listTag: "ul" | "ol" | null = null;
  const closeList = () => {
    if (listTag) {
      html += `</${listTag}>`;
      listTag = null;
    }
  };
  pageAtoms.forEach((a) => {
    if (a.type === "li") {
      if (listTag !== a.tag) {
        closeList();
        html += `<${a.tag}>`;
        listTag = a.tag;
      }
      html += `<li style="list-style-type:'${bulletGlyph}  '">${a.html}</li>`;
    } else {
      closeList();
      if (a.type === "heading") html += `<${a.tag}>${a.html}</${a.tag}>${a.ruleHtml}`;
      else html += `<p>${a.html}</p>`;
    }
  });
  closeList();
  return html || '<p style="color:#9aa1ad">Start typing or upload a document to begin…</p>';
}
