import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../store/useAppStore";
import { buildPages } from "../../pagination/buildPages";
import { PAGE_W, PAGE_H } from "../../pagination/paginate";

const ZOOM_OPTIONS = [0.5, 0.65, 0.8, 1, 1.25];

export default function PreviewPane() {
  const doc = useAppStore((s) => s.doc);
  const [zoom, setZoom] = useState(0.8);
  const [pageHtmlList, setPageHtmlList] = useState<string[]>([]);
  const printRoot = document.getElementById("print-root");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const { pageHtmlList } = buildPages(doc);
      setPageHtmlList(pageHtmlList);
    }, 120); // debounce expensive pagination recompute while typing
    return () => window.clearTimeout(id);
  }, [doc]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-app-border bg-slate-50 flex-none">
        <select
          className="text-xs border border-app-border rounded-md px-1.5 py-1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        >
          {ZOOM_OPTIONS.map((z) => (
            <option key={z} value={z}>
              {Math.round(z * 100)}%
            </option>
          ))}
        </select>
        <span className="text-xs text-app-muted">
          {pageHtmlList.length} page{pageHtmlList.length === 1 ? "" : "s"} · A4 · zoom is visual only
        </span>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col items-center gap-5 bg-slate-200/70">
        {pageHtmlList.map((html, i) => (
          <div
            key={i}
            className="page-wrap"
            style={{ width: PAGE_W * zoom, height: PAGE_H * zoom }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: PAGE_W,
                height: PAGE_H,
                position: "absolute",
                top: 0,
                left: 0,
              }}
              dangerouslySetInnerHTML={{ __html: html.replace('class="a4-page', 'class="a4-page shadow-screen') }}
            />
          </div>
        ))}
      </div>

      {/* Canonical print/export markup — identical HTML to the preview above,
          at true (unscaled) size, hidden on screen and shown only under
          @media print — so preview and the exported PDF can never diverge. */}
      {printRoot && createPortal(<div dangerouslySetInnerHTML={{ __html: pageHtmlList.join("") }} />, printRoot)}
    </div>
  );
}
