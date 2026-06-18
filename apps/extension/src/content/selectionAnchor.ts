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
    context_text: contextText ? clipTextAroundQuote(contextText, quoteText, MAX_CONTEXT_LENGTH) : undefined,
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

function clipTextAroundQuote(text: string, quote: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const quoteIndex = text.indexOf(quote);
  if (quoteIndex === -1) {
    return `${text.slice(0, maxLength - 3).trimEnd()}...`;
  }

  const quoteEnd = quoteIndex + quote.length;
  const markerBudget = 6;
  const contentBudget = Math.max(maxLength - markerBudget, quote.length);
  const contextBudget = Math.max(contentBudget - quote.length, 0);
  const beforeLength = Math.floor(contextBudget / 2);
  const afterLength = contextBudget - beforeLength;
  const start = Math.max(quoteIndex - beforeLength, 0);
  const end = Math.min(quoteEnd + afterLength, text.length);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
