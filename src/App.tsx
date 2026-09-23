import { useEffect, useRef } from "react";
import { useAppStore, loadDraftFromStorage } from "./store/useAppStore";
import InputScreen from "./components/InputScreen";
import Workspace from "./components/Workspace";

export default function App() {
  const screen = useAppStore((s) => s.screen);
  const doc = useAppStore((s) => s.doc);
  const restore = useAppStore((s) => s.restore);
  const setScreen = useAppStore((s) => s.setScreen);
  const markSaved = useAppStore((s) => s.markSaved);
  const askedRestore = useRef(false);

  // Offer to restore a previous local draft, once, on first load.
  useEffect(() => {
    if (askedRestore.current) return;
    askedRestore.current = true;
    const draft = loadDraftFromStorage();
    if (draft && draft.editorHtml && window.confirm("Restore your previous draft?")) {
      restore(draft);
      setScreen("workspace");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave whenever the document model changes.
  useEffect(() => {
    if (!doc.editorHtml) return;
    const id = window.setTimeout(() => markSaved(), 800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        markSaved();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [markSaved]);

  return screen === "input" ? <InputScreen /> : <Workspace />;
}
