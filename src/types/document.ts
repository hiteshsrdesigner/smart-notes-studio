export type TemplateId = "sr" | "minimal" | "upsc";

export interface ThemeColors {
  primary: string;
  accent: string;
  body: string;
  secondary: string;
  border: string;
}

export const THEMES: Record<TemplateId, ThemeColors> = {
  sr: { primary: "#16386b", accent: "#c0392b", body: "#232323", secondary: "#5b5b5b", border: "#16386b" },
  minimal: { primary: "#2b2b2b", accent: "#7a7a7a", body: "#242424", secondary: "#6c6c6c", border: "#2b2b2b" },
  upsc: { primary: "#154734", accent: "#b06a1e", body: "#232323", secondary: "#5b5b5b", border: "#154734" },
};

export interface HeaderSettings {
  institute: string;
  tagline: string;
  title: string;
  date: string;
  logoDataUrl: string | null;
<<<<<<< HEAD
  logoHeight: number; // px, applied to the logo image in the header
=======
>>>>>>> b233435fded8add50f35fa7cc3459e3d30b91e0b
}

export interface BorderSettings {
  enabled: boolean;
  style: "single" | "double";
  color: string;
  thickness: string; // e.g. "1.1px"
  insetOuter: string; // e.g. "4mm"
  insetInner: string; // e.g. "6mm"
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
}

export interface FooterSettings {
  text: string;
  showPageNumbers: boolean;
}

export interface RedRuleSettings {
  thickness: "1px" | "1.5px" | "2px";
  width: "100%" | "90%" | "75%" | "50%";
}

export interface BulletSettings {
  glyph: "●" | "•" | "→" | "✓" | "-";
}

export interface DocumentMetadata {
  fileName: string;
  pageCountSource: number;
  sourceFullText: string;
  sourceWordCount: number;
  sourceCharCount: number;
}

export interface DocumentModel {
  template: TemplateId;
  header: HeaderSettings;
  border: BorderSettings;
  watermark: WatermarkSettings;
  footer: FooterSettings;
  redRule: RedRuleSettings;
  bullet: BulletSettings;
  contentLock: boolean;
  editorHtml: string;
  metadata: DocumentMetadata;
}

export function defaultDocument(): DocumentModel {
  return {
    template: "sr",
    header: {
      institute: "SHUBHRA RANJAN",
      tagline: "Always Ahead",
      title: "DAILY CURRENT AFFAIRS",
      date: "",
      logoDataUrl: null,
<<<<<<< HEAD
      logoHeight: 38,
=======
>>>>>>> b233435fded8add50f35fa7cc3459e3d30b91e0b
    },
    border: {
      enabled: true,
      style: "double",
      color: THEMES.sr.border,
      thickness: "1.1px",
      insetOuter: "4mm",
      insetInner: "6mm",
    },
    watermark: { enabled: true, text: "SHUBHRA RANJAN" },
    footer: { text: "Shubhra Ranjan | Always Ahead", showPageNumbers: true },
    redRule: { thickness: "1px", width: "100%" },
    bullet: { glyph: "●" },
    contentLock: true,
    editorHtml: "",
    metadata: { fileName: "", pageCountSource: 0, sourceFullText: "", sourceWordCount: 0, sourceCharCount: 0 },
  };
}
