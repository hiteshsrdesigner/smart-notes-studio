import { X } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export default function ValidationBanner({ onClose }: { onClose: () => void }) {
  const doc = useAppStore((s) => s.doc);

  const container = document.createElement("div");
  container.innerHTML = doc.editorHtml;
  const finalText = container.innerText || container.textContent || "";
  const finalWords = finalText.split(/\s+/).filter(Boolean).length;
  const sourceWords = doc.metadata.sourceWordCount;
  const diff = finalWords - sourceWords;
  const matched = diff === 0;

  return (
    <div className="absolute top-14 right-4 z-30 w-80 bg-white border border-app-border rounded-xl shadow-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-app-navy">Content Validation</div>
        <button onClick={onClose} className="text-app-muted hover:text-app-ink">
          <X size={16} />
        </button>
      </div>
      <Row label="Source words" value={sourceWords} />
      <Row label="Final words" value={finalWords} />
      <div className="flex justify-between py-1 text-[12.5px]">
        <span className={matched ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
          {matched ? "✓ Matched" : "⚠ Difference"}
        </span>
        <b>{diff > 0 ? `+${diff}` : diff} words</b>
      </div>
      <p className="text-[11px] text-app-muted mt-2">
        Word-count comparison is a fast proxy check — always re-read facts, dates and numbers before publishing. A
        title/date banner detected at the top of the source is moved into the Header fields, so a small difference
        there is expected.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-1 text-[12.5px]">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
