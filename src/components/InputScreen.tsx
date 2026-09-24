import { useRef, useState } from "react";
import { UploadCloud, ClipboardPaste, ArrowRight } from "lucide-react";
import { buildEditorHtmlFromText } from "../utils/textNormalize";
import { useAppStore } from "../store/useAppStore";

type Mode = "idle" | "pdf" | "paste";

export default function InputScreen() {
  const [mode, setMode] = useState<Mode>("idle");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [ready, setReady] = useState<{ fileName: string; pages: number; words: number; chars: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<{ fileName: string; pages: string[]; fullText: string; html: string; metadataDate: string } | null>(null);

  const loadFromExtraction = useAppStore((s) => s.loadFromExtraction);
  const setScreen = useAppStore((s) => s.setScreen);

  async function handleFile(file: File) {
    setError("");
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setBusy(true);
    try {
      const { extractPdfText } = await import("../utils/pdfExtract"); // code-split: pdf.js only loads when actually needed
      const { pages, fullText, scanned } = await extractPdfText(file);
      if (scanned) {
        setError("This PDF appears to be scanned/image-based — no selectable text was found. OCR support can be added in a future version.");
        setBusy(false);
        return;
      }
      const { html, metadataDate } = buildEditorHtmlFromText(fullText);
      const words = fullText.split(/\s+/).filter(Boolean).length;
      pendingRef.current = { fileName: file.name, pages, fullText, html, metadataDate };
      setReady({ fileName: file.name, pages: pages.length, words, chars: fullText.length });
      setMode("pdf");
    } catch (e) {
      console.error(e);
      setError("Unable to extract text from this PDF.");
    } finally {
      setBusy(false);
    }
  }

  function handlePasteContinue() {
    const text = pasteText.trim();
    if (!text) {
      setError("Paste or type some content first.");
      return;
    }
    const { html, metadataDate } = buildEditorHtmlFromText(text);
    const words = text.split(/\s+/).filter(Boolean).length;
    pendingRef.current = { fileName: "Pasted text", pages: [text], fullText: text, html, metadataDate };
    setReady({ fileName: "Pasted text", pages: 1, words, chars: text.length });
  }

  function goToEditor() {
    if (!pendingRef.current) return;
    loadFromExtraction(pendingRef.current);
    setScreen("workspace");
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center px-6 py-14">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 overflow-hidden bg-white">
  <img
    src="/logo.png"
    alt="Office Logo"
    className="w-full h-full object-contain"
  />
      </div>
      <h1 className="font-doc text-2xl font-extrabold text-app-navy mb-1">Smart Notes Studio</h1>
      <p className="text-app-muted text-sm mb-10">Create professional study notes from typed PDFs or text.</p>

      <div className="grid md:grid-cols-2 gap-5 w-full max-w-3xl">
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
            dragging ? "border-app-crimson bg-app-soft" : "border-app-border hover:border-app-navy"
          }`}
        >
          <UploadCloud className="mx-auto mb-3 text-app-navy" size={30} />
          <div className="font-semibold text-app-ink mb-1">Upload PDF</div>
          <div className="text-xs text-app-muted">Drag & drop, or click to browse. Multi-page supported.</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div
          onClick={() => setMode("paste")}
          className={`bg-white rounded-2xl border-2 p-8 text-center cursor-pointer transition ${
            mode === "paste" ? "border-app-navy" : "border-app-border hover:border-app-navy"
          }`}
        >
          <ClipboardPaste className="mx-auto mb-3 text-app-navy" size={30} />
          <div className="font-semibold text-app-ink mb-1">Paste / Type Text</div>
          <div className="text-xs text-app-muted">Paste from Word, WhatsApp, or the browser — or just type.</div>
        </div>
      </div>

      {mode === "paste" && !ready && (
        <div className="w-full max-w-3xl mt-5 bg-white rounded-2xl border border-app-border p-4">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={8}
            placeholder="Paste or type your notes content here…"
            className="w-full border border-app-border rounded-lg p-3 text-sm outline-none"
          />
          <button onClick={handlePasteContinue} className="mt-3 bg-app-navy text-white text-sm px-4 py-2 rounded-lg font-medium">
            Continue
          </button>
        </div>
      )}

      {busy && <div className="mt-6 text-sm text-app-muted">Reading PDF…</div>}
      {error && <div className="mt-6 text-sm text-app-crimson max-w-lg text-center">{error}</div>}

      {ready && (
        <div className="w-full max-w-3xl mt-6 bg-white rounded-2xl border border-app-border p-5">
          <div className="text-sm font-semibold text-app-ink mb-2 break-words">{ready.fileName}</div>
          <div className="grid grid-cols-4 gap-3 text-xs text-app-muted mb-4">
            <Stat label="Pages" value={ready.pages} />
            <Stat label="Words" value={ready.words} />
            <Stat label="Characters" value={ready.chars} />
            <Stat label="Text" value="Extracted ✓" />
          </div>
          <button
            onClick={goToEditor}
            className="w-full bg-app-crimson text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            Next → Edit Notes <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-app-ink font-semibold text-sm">{value}</div>
    </div>
  );
}
