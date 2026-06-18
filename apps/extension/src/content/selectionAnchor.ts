export type TextAnchorDraft = {
  kind: "text";
  quote_text: string;
  context_text?: string;
  source_url: string;
  dom_path?: string;
};

const MAX_CONTEXT_LENGTH = 500;

export function captureSelectionAnchor(win: Window, doc: Document): TextAnchorDraft | null {
  const selection = win.getSelection();
  const quoteText = selection?.toString().trim();

  if (!selection || !quoteText || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const parentElement = closestElement(range.commonAncestorContainer);
  const contextText = parentElement?.textContent?.replace(/\s+/g, " ").trim();

  return {
    kind: "text",
    quote_text: quoteText,
    context_text: contextText ? clipText(contextText, MAX_CONTEXT_LENGTH) : undefined,
    source_url: win.location.href,
    dom_path: parentElement ? buildDomPath(parentElement, doc) : undefined
  };
}

function closestElement(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

function buildDomPath(element: Element, doc: Document): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== doc.documentElement.parentElement) {
    const id = current.id ? `#${current.id}` : "";
    parts.unshift(`${current.tagName.toLowerCase()}${id}`);

    if (current === doc.documentElement) {
      break;
    }
    current = current.parentElement;
  }

  return parts.join(" > ");
}

function clipText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
