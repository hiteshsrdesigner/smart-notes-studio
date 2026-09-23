import { Node, mergeAttributes } from "@tiptap/core";

/**
 * A real HTML <hr class="heading-rule"> node (never an image). Inserted
 * immediately after a heading by the editor toolbar's Red Rule button.
 * It's a plain leaf block node so TipTap/ProseMirror treats it as a single
 * atomic unit that always renders identically in the editor, the live
 * preview and print/export (all three read the same class + CSS variables).
 */
export const RedRule = Node.create({
  name: "redRule",
  group: "block",
  selectable: false,
  atom: true,

  parseHTML() {
    return [{ tag: "hr.heading-rule" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["hr", mergeAttributes(HTMLAttributes, { class: "heading-rule" })];
  },
});

export default RedRule;
