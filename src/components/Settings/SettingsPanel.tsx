import { useAppStore } from "../../store/useAppStore";
import type { TemplateId } from "../../types/document";

const TEMPLATES: { id: TemplateId; name: string; desc: string }[] = [
  { id: "sr", name: "Shubhra Ranjan Current Affairs", desc: "Navy headings · red rules · double border" },
  { id: "minimal", name: "Minimal Notes", desc: "Grayscale, no-frills, clean" },
  { id: "upsc", name: "UPSC / MPSC Notes", desc: "Deep green heading accent" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "w-full px-2.5 py-1.5 border border-app-border rounded-md text-[12.5px] bg-white";

export default function SettingsPanel() {
  const doc = useAppStore((s) => s.doc);
  const setTemplate = useAppStore((s) => s.setTemplate);
  const updateHeader = useAppStore((s) => s.updateHeader);
  const updateBorder = useAppStore((s) => s.updateBorder);
  const updateWatermark = useAppStore((s) => s.updateWatermark);
  const updateFooter = useAppStore((s) => s.updateFooter);
  const updateRedRule = useAppStore((s) => s.updateRedRule);
  const updateDoc = useAppStore((s) => s.updateDoc);

  const onLogo = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => updateHeader({ logoDataUrl: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 text-app-ink">
      <SectionTitle>Template</SectionTitle>
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTemplate(t.id)}
          className={`w-full text-left border rounded-lg px-2.5 py-2 mb-1.5 ${
            doc.template === t.id ? "border-app-crimson bg-app-soft" : "border-app-border"
          }`}
        >
          <div className="text-[12.5px] font-bold text-app-navy">{t.name}</div>
          <div className="text-[11px] text-app-muted mt-0.5">{t.desc}</div>
        </button>
      ))}

      <SectionTitle>Header</SectionTitle>
      <Field label="Institute name">
        <input className={inputCls} value={doc.header.institute} onChange={(e) => updateHeader({ institute: e.target.value })} />
      </Field>
      <Field label="Tagline">
        <input className={inputCls} value={doc.header.tagline} onChange={(e) => updateHeader({ tagline: e.target.value })} />
      </Field>
      <Field label="Document title">
        <input className={inputCls} value={doc.header.title} onChange={(e) => updateHeader({ title: e.target.value })} />
      </Field>
      <Field label="Date (auto-detected, editable)">
        <input className={inputCls} value={doc.header.date} onChange={(e) => updateHeader({ date: e.target.value })} />
      </Field>
      <Field label="Logo">
        <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} className="text-xs" />
      </Field>

      <SectionTitle>Bullets</SectionTitle>
      <div className="flex gap-1.5 flex-wrap mb-1">
        {(["●", "•", "→", "✓", "-"] as const).map((b) => (
          <button
            key={b}
            onClick={() => updateDoc({ bullet: { glyph: b } })}
            className={`px-2.5 py-1 rounded-full text-xs border ${
              doc.bullet.glyph === b ? "bg-app-navy text-white border-app-navy" : "border-app-border bg-white"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <SectionTitle>Heading Red Rule</SectionTitle>
      <div className="flex gap-2 mb-1">
        <Field label="Thickness">
          <select className={inputCls} value={doc.redRule.thickness} onChange={(e) => updateRedRule({ thickness: e.target.value as any })}>
            <option value="1px">1px</option>
            <option value="1.5px">1.5px</option>
            <option value="2px">2px</option>
          </select>
        </Field>
        <Field label="Width">
          <select className={inputCls} value={doc.redRule.width} onChange={(e) => updateRedRule({ width: e.target.value as any })}>
            <option value="100%">Full</option>
            <option value="90%">90%</option>
            <option value="75%">75%</option>
            <option value="50%">50%</option>
          </select>
        </Field>
      </div>
      <p className="text-[11px] text-app-muted -mt-1 mb-3">
        Click inside a heading, then the red-rule button in the toolbar, to add or remove its rule.
      </p>

      <SectionTitle>Border</SectionTitle>
      <ToggleRow label="Border enabled">
        <input type="checkbox" checked={doc.border.enabled} onChange={(e) => updateBorder({ enabled: e.target.checked })} />
      </ToggleRow>
      <div className="flex gap-2">
        <Field label="Style">
          <select className={inputCls} value={doc.border.style} onChange={(e) => updateBorder({ style: e.target.value as any })}>
            <option value="single">Single</option>
            <option value="double">Double</option>
          </select>
        </Field>
        <Field label="Thickness">
          <select className={inputCls} value={doc.border.thickness} onChange={(e) => updateBorder({ thickness: e.target.value })}>
            <option value="0.8px">0.8px</option>
            <option value="1.1px">1.1px</option>
            <option value="1.5px">1.5px</option>
            <option value="2px">2px</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-2 items-end">
        <Field label="Border color">
          <input type="color" className="w-full h-8 border border-app-border rounded-md" value={doc.border.color} onChange={(e) => updateBorder({ color: e.target.value })} />
        </Field>
        <Field label="Inset (outer)">
          <select className={inputCls} value={doc.border.insetOuter} onChange={(e) => updateBorder({ insetOuter: e.target.value })}>
            {["2mm", "3mm", "4mm", "5mm", "6mm"].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
      </div>

      <SectionTitle>Watermark</SectionTitle>
      <ToggleRow label="Watermark enabled">
        <input type="checkbox" checked={doc.watermark.enabled} onChange={(e) => updateWatermark({ enabled: e.target.checked })} />
      </ToggleRow>
      <Field label="Watermark text">
        <input className={inputCls} value={doc.watermark.text} onChange={(e) => updateWatermark({ text: e.target.value })} />
      </Field>

      <SectionTitle>Footer</SectionTitle>
      <Field label="Footer text">
        <input className={inputCls} value={doc.footer.text} onChange={(e) => updateFooter({ text: e.target.value })} />
      </Field>
      <ToggleRow label="Show page numbers">
        <input type="checkbox" checked={doc.footer.showPageNumbers} onChange={(e) => updateFooter({ showPageNumbers: e.target.checked })} />
      </ToggleRow>

      <SectionTitle>Content Lock</SectionTitle>
      <ToggleRow label="🔒 Lock facts (block AI edits)">
        <input type="checkbox" checked={doc.contentLock} onChange={(e) => updateDoc({ contentLock: e.target.checked })} />
      </ToggleRow>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-app-muted font-semibold mt-4 mb-1.5 first:mt-0">{children}</div>;
}
function ToggleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[12.5px]">
      <span>{label}</span>
      {children}
    </div>
  );
}
