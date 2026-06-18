export type ImageAnchorDraft = {
  kind: "image";
  source_url: string;
  image_url?: string;
  alt_text?: string;
  caption_text?: string;
};

export function createImageAnchorFromElement(img: HTMLImageElement): ImageAnchorDraft {
  const imageUrl = img.currentSrc || img.src || undefined;
  const altText = img.alt.trim() || undefined;
  const captionText = findCaptionText(img);

  return compactImageAnchor({
    kind: "image",
    source_url: location.href,
    image_url: imageUrl,
    alt_text: altText,
    caption_text: captionText
  });
}

function findCaptionText(img: HTMLImageElement): string | undefined {
  const figure = img.closest("figure");
  const figureCaption = figure?.querySelector("figcaption")?.textContent;
  const ariaDescription = img.getAttribute("aria-description");
  const title = img.title;

  return [figureCaption, ariaDescription, title]
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .find((value): value is string => Boolean(value));
}

function compactImageAnchor(anchor: ImageAnchorDraft): ImageAnchorDraft {
  return Object.fromEntries(
    Object.entries(anchor).filter(([, value]) => value !== undefined && value !== "")
  ) as ImageAnchorDraft;
}
