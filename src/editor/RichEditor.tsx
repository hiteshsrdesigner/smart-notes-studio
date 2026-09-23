import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import RedRule from "./RedRuleExtension";
import Toolbar from "./Toolbar";
import { useAppStore } from "../store/useAppStore";

export default function RichEditor() {
  const doc = useAppStore((s) => s.doc);
  const setEditorHtml = useAppStore((s) => s.setEditorHtml);
  const initializedFor = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontFamily,
      RedRule,
      Placeholder.configure({ placeholder: "Upload a PDF, paste text, or start typing…" }),
    ],
    content: doc.editorHtml || "",
    onUpdate: ({ editor }) => {
      setEditorHtml(editor.getHTML());
    },
  });

  // When new content is loaded from an extraction (fileName changes), push it
  // into the editor once, without fighting the user's own typing afterwards.
  useEffect(() => {
    if (!editor) return;
    const key = doc.metadata.fileName + ":" + doc.metadata.sourceCharCount;
    if (initializedFor.current !== key && doc.editorHtml) {
      editor.commands.setContent(doc.editorHtml);
      initializedFor.current = key;
    }
  }, [editor, doc.metadata.fileName, doc.metadata.sourceCharCount, doc.editorHtml]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto px-8 py-6 doc-body">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
