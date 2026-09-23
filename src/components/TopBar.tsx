import { ArrowLeft, CheckCircle2, Printer, Save } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
}

export default function TopBar({ onValidate }: { onValidate: () => void }) {
  const doc = useAppStore((s) => s.doc);
  const setScreen = useAppStore((s) => s.setScreen);
  const markSaved = useAppStore((s) => s.markSaved);
  const lastSavedAt = useAppStore((s) => s.lastSavedAt);

  function handleExport() {
    const filename = sanitizeFilename(`${doc.header.title}${doc.header.date ? "_" + doc.header.date : ""}`) + ".pdf";
    const prevTitle = document.title;
    document.title = filename.replace(/\.pdf$/, "");
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        document.title = prevTitle;
      }, 500);
    }, 80);
  }

  return (
    <div className="flex items-center gap-3 bg-app-navy text-white px-4 py-2.5 border-b-[3px] border-app-crimson flex-none">
      <button onClick={() => setScreen("input")} className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md">
        <ArrowLeft size={15} /> Back
      </button>
      <div className="text-sm font-semibold font-doc truncate max-w-[220px]">{doc.metadata.fileName || "Untitled document"}</div>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] text-slate-300 min-w-[90px] text-right">
          {lastSavedAt ? `Saved ✓ ${new Date(lastSavedAt).toLocaleTimeString()}` : "Not saved yet"}
        </span>
        <button onClick={() => markSaved()} className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md">
          <Save size={15} /> Save
        </button>
        <button onClick={onValidate} className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-md">
          <CheckCircle2 size={15} /> Validate
        </button>
        <button onClick={handleExport} className="flex items-center gap-1.5 text-sm bg-app-crimson hover:bg-red-700 px-3 py-1.5 rounded-md font-semibold">
          <Printer size={15} /> Export PDF
        </button>
      </div>
    </div>
  );
}
