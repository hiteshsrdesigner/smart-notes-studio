import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Minus,
  Sparkles,
} from "lucide-react";

function toggleRedRule(editor: Editor): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  let headingDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type.name === "heading") {
      headingDepth = d;
      break;
    }
  }
  if (headingDepth === -1) return false;

  const headingNode = $from.node(headingDepth);
  const headingStart = $from.before(headingDepth);
  const headingEnd = headingStart + headingNode.nodeSize;
  const nodeAfter = state.doc.nodeAt(headingEnd);
  const tr = state.tr;

  if (nodeAfter && nodeAfter.type.name === "redRule") {
    tr.delete(headingEnd, headingEnd + nodeAfter.nodeSize);
  } else {
    const redRuleType = state.schema.nodes.redRule;
    tr.insert(headingEnd, redRuleType.create());
  }
  view.dispatch(tr);
  return true;
}

function TBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm hover:bg-slate-200/70 ${
        active ? "bg-app-soft text-app-crimson" : "text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function smartFormat(editor: Editor) {
  const html = editor.getHTML();
  const container = document.createElement("div");
  container.innerHTML = html;
  const LABEL_RE =
    /\b(Composition|Purpose|Chairperson|Functions|Nodal Ministry|India'?s Rank|Key Parameters|Kigali Amendment|Investigation|Term|Introduced|Launched|Released)\s*:/;
  container.querySelectorAll("li,p").forEach((el) => {
    if (el.querySelector("b,strong")) return;
    el.innerHTML = el.innerHTML.replace(LABEL_RE, (_m, p1) => `<b>${p1}:</b>`);
  });
  editor.commands.setContent(container.innerHTML);
}

export default function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-2 border-b border-app-border bg-slate-50">
      <select
        className="text-xs border border-app-border rounded-md px-1.5 py-1 bg-white"
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        title="Font"
        defaultValue="Poppins"
      >
        <option value="Poppins">Poppins</option>
        <option value="Inter">Inter</option>
        <option value="'Noto Sans Devanagari'">Noto Sans Devanagari</option>
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="'Times New Roman'">Times New Roman</option>
      </select>

      <div className="w-px h-5 bg-app-border mx-1" />
      <TBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={15} />
      </TBtn>
      <TBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={15} />
      </TBtn>
      <TBtn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={15} />
      </TBtn>
      <TBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={15} />
      </TBtn>

      <div className="w-px h-5 bg-app-border mx-1" />
      <TBtn title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </TBtn>
      <TBtn title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
        ¶
      </TBtn>
      <TBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={15} />
      </TBtn>
      <TBtn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={15} />
      </TBtn>

      <div className="w-px h-5 bg-app-border mx-1" />
      <TBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft size={15} />
      </TBtn>
      <TBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter size={15} />
      </TBtn>
      <TBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight size={15} />
      </TBtn>
      <TBtn title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        <AlignJustify size={15} />
      </TBtn>

      <div className="w-px h-5 bg-app-border mx-1" />
      <input
        type="color"
        title="Text color"
        className="w-6 h-6 border border-app-border rounded-md p-0 cursor-pointer"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
      />
      <input
        type="color"
        title="Highlight"
        defaultValue="#fff59d"
        className="w-6 h-6 border border-app-border rounded-md p-0 cursor-pointer"
        onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
      />

      <div className="w-px h-5 bg-app-border mx-1" />
      <TBtn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={15} />
      </TBtn>
      <TBtn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={15} />
      </TBtn>
      <TBtn title="Add Red Rule Below Heading" onClick={() => toggleRedRule(editor)}>
        <Minus size={15} className="text-app-crimson" />
      </TBtn>
      <TBtn title="Smart Format: bold labels, no facts changed" onClick={() => smartFormat(editor)}>
        <Sparkles size={15} />
      </TBtn>
    </div>
  );
}
