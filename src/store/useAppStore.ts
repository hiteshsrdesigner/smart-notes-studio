import { create } from "zustand";
import type { DocumentModel, TemplateId } from "../types/document";
import { defaultDocument, THEMES } from "../types/document";

export type Screen = "input" | "workspace";

interface AppState {
  screen: Screen;
  doc: DocumentModel;
  lastSavedAt: number | null;

  setScreen: (s: Screen) => void;
  updateDoc: (patch: Partial<DocumentModel>) => void;
  updateHeader: (patch: Partial<DocumentModel["header"]>) => void;
  updateBorder: (patch: Partial<DocumentModel["border"]>) => void;
  updateWatermark: (patch: Partial<DocumentModel["watermark"]>) => void;
  updateFooter: (patch: Partial<DocumentModel["footer"]>) => void;
  updateRedRule: (patch: Partial<DocumentModel["redRule"]>) => void;
  setTemplate: (t: TemplateId) => void;
  setEditorHtml: (html: string) => void;
  loadFromExtraction: (opts: {
    fileName: string;
    pages: string[];
    fullText: string;
    html: string;
    metadataDate: string;
  }) => void;
  markSaved: () => void;
  restore: (doc: DocumentModel) => void;
  reset: () => void;
}

const STORAGE_KEY = "smart-notes-studio:draft";

export const useAppStore = create<AppState>((set, get) => ({
  screen: "input",
  doc: defaultDocument(),
  lastSavedAt: null,

  setScreen: (s) => set({ screen: s }),

  updateDoc: (patch) => set((state) => ({ doc: { ...state.doc, ...patch } })),

  updateHeader: (patch) =>
    set((state) => ({ doc: { ...state.doc, header: { ...state.doc.header, ...patch } } })),

  updateBorder: (patch) =>
    set((state) => ({ doc: { ...state.doc, border: { ...state.doc.border, ...patch } } })),

  updateWatermark: (patch) =>
    set((state) => ({ doc: { ...state.doc, watermark: { ...state.doc.watermark, ...patch } } })),

  updateFooter: (patch) =>
    set((state) => ({ doc: { ...state.doc, footer: { ...state.doc.footer, ...patch } } })),

  updateRedRule: (patch) =>
    set((state) => ({ doc: { ...state.doc, redRule: { ...state.doc.redRule, ...patch } } })),

  setTemplate: (t) =>
    set((state) => ({
      doc: { ...state.doc, template: t, border: { ...state.doc.border, color: THEMES[t].border } },
    })),

  setEditorHtml: (html) => set((state) => ({ doc: { ...state.doc, editorHtml: html } })),

  loadFromExtraction: ({ fileName, pages, fullText, html, metadataDate }) => {
    const words = fullText.split(/\s+/).filter(Boolean).length;
    set((state) => ({
      doc: {
        ...state.doc,
        editorHtml: html,
        header: { ...state.doc.header, date: metadataDate || state.doc.header.date },
        metadata: {
          fileName,
          pageCountSource: pages.length,
          sourceFullText: fullText,
          sourceWordCount: words,
          sourceCharCount: fullText.length,
        },
      },
    }));
  },

  markSaved: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().doc));
      set({ lastSavedAt: Date.now() });
    } catch {
      /* best-effort */
    }
  },

  restore: (doc) => set({ doc, lastSavedAt: Date.now() }),

  reset: () => set({ doc: defaultDocument(), screen: "input" }),
}));

export function loadDraftFromStorage(): DocumentModel | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DocumentModel;
  } catch {
    return null;
  }
}
