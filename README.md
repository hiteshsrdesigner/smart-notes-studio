# Smart Notes Studio

**Typed PDF / Text → Professional Study Notes**

A client-side web app for turning a typed PDF (or pasted text) into a clean,
professionally typeset A4 notes document — built for UPSC / MPSC / PSIR /
daily current-affairs style notes, but usable for any typed source.

Upload → extract & clean → edit in a real rich-text editor with a live A4
preview → export a selectable, print-ready PDF. No backend, no account, no
API key required.

---

## 1. Project overview

Two screens:

1. **Input** — upload a PDF or paste/type text. The app extracts, cleans and
   structures the content and shows file/word/character stats.
2. **Workspace** — a TipTap rich-text editor on the left, a true live A4
   preview on the right, and a settings panel for header, border, watermark,
   footer, template and the Red Rule feature.

## 2. Features implemented in this version

- Client-side PDF text extraction (pdf.js), page-by-page, order-preserving
- Text normalization: whitespace/hyphenation cleanup, PDF line-wrap paragraph
  reconstruction, bullet/heading detection
- **Metadata vs. body separation** — a leading title/date banner in the
  source is lifted into the Header fields instead of duplicating as a body
  heading
- Scanned-PDF detection (clear message, no silent fake extraction)
- Paste-text input path, going through the same normalization pipeline
- Real rich-text editor (TipTap): bold/italic/underline/strike, H1/H2,
  bullet & numbered lists, alignment, text color, highlight, font family,
  undo/redo, Smart Format (bolds labels like `Purpose:` without touching
  facts)
- **Red Rule**: a real `<hr>` element (never an image) inserted directly
  below a heading via a toolbar button; toggling removes it; it is folded
  into the same pagination "atom" as its heading so it can never be
  separated from that heading across a page break
- **Canonical A4 pagination engine** — content is flattened into atoms
  (heading/paragraph/list-item), each atom's real height is *measured*
  off-screen at true mm-based A4 size, then packed onto pages against the
  actual content-area height. A heading only starts a new page if it **and**
  the atom right after it still fit together — this is what stops a heading
  being stranded alone at the bottom of a page
- **One canonical page-HTML builder** (`src/pagination/buildPages.ts`) feeds
  both the Live Preview and a hidden `#print-root` used for
  print/export — they can't structurally drift apart, and the page
  geometry (`--page-w`, `--page-h`, `--pad-*`, `--border-inset-*`) is a
  single set of mm-based CSS variables shared by screen and print, so the
  exported PDF's border lines up exactly with the preview
- Zoom in Live Preview is a visual CSS transform on a properly-sized wrapper
  box only — it never touches pagination or page count
- Border system: on/off, single/double, color, thickness, inset
- Watermark: on/off, custom text
- Footer: custom text, dynamic "Page X of Y" (never hardcoded)
- Templates: Shubhra Ranjan Current Affairs / Minimal Notes / UPSC-MPSC
  (swap primary/accent/border colors)
- Content Lock toggle (documents the "formatting only, not fact changes"
  intent for any future AI feature)
- Source vs. final **word-count validation**
- Autosave to `localStorage` (debounced) + "restore previous draft?" prompt
  on reload
- Responsive: three-panel desktop layout, tab-based mobile layout
  (Editor / Preview / Settings)
- Marathi/Devanagari font loaded (Noto Sans Devanagari) and selectable in
  the font-family dropdown

## 3. Known limitations / not yet built

Being upfront about scope — these were in the original spec and are **not**
implemented yet:

- Table and image insertion in the editor
- Find & replace
- Full template CRUD (save/duplicate/rename/delete) — only "apply" exists
- Source-panel paragraph-click ↔ editor highlight synchronization
- Multi-candidate date picker (currently takes the first detected date)
- IndexedDB (autosave uses `localStorage`, which is simpler and sufficient
  for a single draft; swap-in IndexedDB later if you need multiple saved
  documents)
- OCR for scanned PDFs (a clear "this looks scanned" message is shown
  instead of silently failing)
- Optional AI features (Smart Format is rule-based, not AI-backed, by
  design — see §11)
- Automated end-to-end tests (Playwright/Vitest) — the project has been
  type-checked and production-built successfully, but not exercised in an
  interactive browser session

## 4. Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · TipTap 2 · pdf.js · Zustand ·
lucide-react. Everything runs client-side; there is no backend in this
version.

## 5. Installation

```bash
npm install
```

## 6. Development

```bash
npm run dev
```

Opens the app with hot reload, typically at `http://localhost:5173`.

## 7. Production build

```bash
npm run build
```

Runs `tsc -b` (type-check) then `vite build`. Output goes to `dist/`.

```bash
npm run preview
```

Serves the production build locally so you can test it before deploying.

## 8. Project structure

```
src/
  types/document.ts          Document model (header/border/watermark/footer/redRule/bullet)
  store/useAppStore.ts       Zustand store: current document + screen + autosave
  utils/
    pdfExtract.ts            pdf.js-based text extraction (code-split, loads on demand)
    textNormalize.ts         Whitespace/hyphenation cleanup, heading/bullet/date detection,
                              metadata-vs-body split, HTML builder for the editor
  pagination/
    paginate.ts               Atom model, off-screen measurement, page-packing algorithm
    buildPages.ts              Canonical page-HTML builder shared by preview + print
  editor/
    RedRuleExtension.ts       TipTap node for the red heading rule (<hr class="heading-rule">)
    RichEditor.tsx            TipTap editor wiring
    Toolbar.tsx                Formatting toolbar incl. Red Rule toggle + Smart Format
  components/
    InputScreen.tsx            Screen 1: upload PDF / paste text
    Workspace.tsx               Screen 2: editor + preview + settings layout
    TopBar.tsx                  Back / Save / Validate / Export PDF
    ValidationBanner.tsx        Source vs. final word-count check
    Preview/PreviewPane.tsx     Live A4 preview + print-root portal
    Settings/SettingsPanel.tsx  Template/header/border/watermark/footer/red-rule settings
  index.css                    Canonical A4 page geometry, theme variables, print CSS
```

## 9. How PDF extraction works

`pdf.js` reads the PDF client-side (nothing is uploaded anywhere). For each
page, text items are grouped by their vertical (`y`) position into lines,
preserving reading order. If the combined extracted text is under ~10
characters, the PDF is treated as scanned/image-based and the user is told
plainly rather than shown a fake empty result.

## 10. How text normalization works

`src/utils/textNormalize.ts`:

1. Fixes PDF line-wrap hyphenation (`environ-\nmental` → `environmental`)
   only when the break looks like a mid-word wrap.
2. Collapses runs of whitespace and normalizes spacing around punctuation.
3. Reconstructs paragraphs: a line is joined to the previous line only if
   the previous line doesn't end in sentence punctuation **and** the new
   line doesn't look like a new bullet/heading — this avoids merging
   distinct bullets or headings together.
4. Detects headings (short, all-caps or numbered lines), bullets (`→ • - ✓`
   prefixes), and dates (several common formats).
5. Strips a **leading metadata banner** (e.g. a title + date at the very top
   of the source) into `metadataTitle` / `metadataDate` instead of letting
   it become the first body heading.
6. Filters out repeated running header/footer noise from the source PDF
   itself (e.g. `"... • Typed Edition • Page 1"`).
7. Builds the editor HTML, bolding a short set of common note labels
   (`Purpose:`, `Composition:`, etc.) without altering any facts.

## 11. How pagination works (and how it avoids the earlier prototype's bugs)

See `src/pagination/paginate.ts` and `buildPages.ts`. In short:

- **One set of mm-based CSS variables** (`--page-w: 210mm`, `--pad-*`,
  `--border-inset-*`) defines the page on screen *and* in print — nothing is
  redefined under `@media print`, so the printed/exported border can't drift
  from the preview.
- Editor HTML is flattened into atoms; each atom is measured off-screen with
  `display: flow-root` (so its own margins are fully captured, not collapsed
  away) at the real content width.
- Atoms are packed onto pages against the real content-area height
  (page height minus padding minus the measured header height on page 1).
  A heading atom only forces a page break if it **and** its very next atom
  don't both fit — this keeps a heading with its first bullet/paragraph.
- A heading's Red Rule is folded into the *same* atom as the heading, so
  heading + rule + (when possible) first bullet always move together.
- Zoom scales a wrapper `<div>` sized to the zoomed dimensions; the `.a4-page`
  itself is always laid out at true size, so zoom never changes page count.

## 12. How PDF export works

`Export PDF` sets `document.title` to a sanitized
`Daily_Current_Affairs_21_September_2026`-style name (many browsers use the
page title as the suggested Save-as-PDF filename), then calls
`window.print()`. The `@media print` rule in `src/index.css` hides
everything except `#print-root`, which was populated with the **exact same**
page HTML the Live Preview is showing (see `buildPages.ts`) — so
Chrome's Print → Save as PDF output matches the preview pixel-for-pixel,
with selectable, real text (never a screenshot).

## 13. How templates work

`src/types/document.ts` defines `THEMES` (primary/accent/body/secondary/
border colors per template id). Selecting a template in Settings swaps the
CSS custom properties (`--doc-primary`, `--doc-accent`, etc.) that the page
and editor styles reference. Only "apply" is implemented in this version —
save/duplicate/rename of custom templates is a natural next step.

## 14. How local storage works

The whole `DocumentModel` (header, border, watermark, footer, red-rule and
bullet settings, template, editor HTML, source metadata) is JSON-serialized
into a single `localStorage` key, debounced ~800ms after any change. On
load, if a draft is found, the user is asked whether to restore it.

## 15. How AI integration can be added later

Nothing in this version calls an external AI API — "Smart Format" is a
plain regex-based labeler. If you add AI features later:

```
Frontend  →  your own serverless function  →  AI API
```

Never put a secret API key in a `VITE_*` variable — those are bundled into
the client and are public. See `.env.example`.

## 16. Environment variables

```
VITE_AI_ENABLED=false
```

The app runs with zero environment variables. `.env.example` exists purely
as a placeholder for an eventual optional AI feature.

## 17. Privacy

PDF parsing happens entirely in the browser via pdf.js — files are never
uploaded anywhere. There is no analytics and no backend in this version.

## 18. Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Delete `node_modules` and `package-lock.json`, retry. Make sure you're on Node 18+ (this was built/tested on Node 22). |
| `npm run build` fails on a TypeScript error | Run `npx tsc -b` alone to see the exact file/line. |
| Blank page after deployment (Cloudflare/GitHub Pages) | Check the browser console for a 404 on `/assets/...` — this usually means the wrong output directory was set. Cloudflare Pages: output directory must be `dist`. |
| PDF export looks different from Live Preview | This should not happen — preview and print share the same generated HTML (`buildPages.ts`) and the same CSS geometry variables. If you do see a mismatch, check whether you've overridden `--page-w`/`--pad-*`/`--border-inset-*` only in one place. |
| Marathi/Devanagari text shows boxes | Confirm you're online on first load (Noto Sans Devanagari loads from Google Fonts) and that the font-family dropdown in the toolbar is set to "Noto Sans Devanagari" for that text. |
| Build warns about a >500KB chunk | This is pdf.js and TipTap/React; pdf.js is already code-split to load only when a PDF is uploaded. Safe to ignore for a v1. |

## 19. Free deployment (Cloudflare Pages)

1. Create a GitHub repository and push this project to it.
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select your repository.
4. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Deploy. Cloudflare gives you a free subdomain like
   `https://your-project.pages.dev`.

`pages.dev` is a free subdomain. A custom `.com` domain is optional and
normally requires purchasing the domain separately; you can attach one to
the same Cloudflare Pages project later.

### Alternative: GitHub Pages

1. `npm run build`
2. Push the contents of `dist/` to a `gh-pages` branch (e.g. with the
   `gh-pages` npm package, or GitHub Actions).
3. Enable GitHub Pages for that branch in the repo's **Settings → Pages**.
4. Your site is served at `https://<username>.github.io/<repo>/`. If the
   repo isn't served from the domain root, set Vite's `base` option in
   `vite.config.ts` to `/<repo>/`.

## 20. Scripts

```bash
npm run dev       # start dev server
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build locally
```
